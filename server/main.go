package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type mediaFile struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Type string `json:"type"`
	Size int64 `json:"size"`
	Modified string `json:"modified"`
}

func main() {
	root := env("APP_ROOT", "..")
	defaultMedia := filepath.Join(root, "media")
	if _, err := os.Stat(defaultMedia); err != nil {
		defaultMedia = "/srv/media"
	}
	mediaRoot := env("MEDIA_ROOT", defaultMedia)
	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, _ *http.Request) {
		jsonResponse(w, http.StatusOK, map[string]string{"status": "ok", "mediaRoot": mediaRoot})
	})
	mux.HandleFunc("/api/media", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			jsonResponse(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		files, err := scanMedia(mediaRoot)
		if err != nil {
			jsonResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		jsonResponse(w, http.StatusOK, files)
	})
	mux.Handle("/media/", http.StripPrefix("/media/", http.FileServer(http.Dir(mediaRoot))))
	mux.Handle("/focus-flight/", http.StripPrefix("/focus-flight/", http.FileServer(http.Dir(filepath.Join(root, "focus-flight")))))
	mux.Handle("/", http.FileServer(http.Dir(root)))

	address := env("LISTEN_ADDR", ":8080")
	log.Printf("Sentinel listening on %s", address)
	log.Printf("Serving media from %s", mediaRoot)
	log.Fatal(http.ListenAndServe(address, withSecurityHeaders(mux)))
}

func scanMedia(root string) ([]mediaFile, error) {
	var files []mediaFile
	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() || strings.HasPrefix(info.Name(), ".") {
			return nil
		}
		typeName := mediaType(path)
		if typeName == "other" {
			return nil
		}
		relative, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		files = append(files, mediaFile{Name: info.Name(), Path: "/media/" + filepath.ToSlash(relative), Type: typeName, Size: info.Size(), Modified: info.ModTime().UTC().Format("2006-01-02T15:04:05Z")})
		return nil
	})
	return files, err
}

func mediaType(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	normalized := strings.ToLower(filepath.ToSlash(path))
	if strings.Contains(normalized, "/audio/") {
		switch ext {
		case ".mp3", ".wav", ".ogg", ".flac", ".m4a", ".webm", ".aac", ".opus":
			return "audio"
		}
	}
	switch ext {
	case ".mp4", ".mov", ".mkv":
		return "video"
	case ".webm":
		if strings.Contains(normalized, "audio") {
			return "audio"
		}
		return "video"
	case ".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac", ".opus":
		return "audio"
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg":
		return "image"
	default:
		return "other"
	}
}

func withSecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Content-Security-Policy", "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'")
		next.ServeHTTP(w, r)
	})
}

func jsonResponse(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
