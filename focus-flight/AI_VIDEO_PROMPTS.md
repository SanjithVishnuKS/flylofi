# Focus Flight AI Video Pack

Each prompt below is written to be pasted directly into Higgsfield or another AI video maker. They are intentionally close to 1,024 characters, so each clip keeps the same visual language while still describing its own flight phase. Generate 1920x1080 MP4, 24 or 30 fps, 8 to 12 seconds, seamless loop, no music, no dialogue, no text, no logos, no airline branding, and no visible people. Keep the same window framing and seat silhouette for every clip.

Save the generated files on Debian at `/srv/media/flight/clips/` as `boarding.mp4`, `pushback.mp4`, `cruise.mp4`, `descent.mp4`, and `landing.mp4`.

## Boarding prompt

Cinematic first-person view from a quiet economy-class airplane window seat before takeoff at blue hour. The dark teal cabin interior frames a large oval window; a subtle seat edge, window trim, and warm reading light remain visible in the foreground. Outside, the aircraft is parked at a modern airport gate with distant terminal windows, soft ramp lights, slow service vehicles, and a deep blue evening sky. Show delicate reflections on the glass and gentle natural cabin vibration, creating calm anticipation rather than drama. Keep the camera locked in the passenger seat with only realistic micro-motion. No people, hands, cockpit, text, logos, airline branding, music, or hard cuts. Realistic aviation documentary look, premium focus atmosphere, natural exposure, soft contrast, seamless 8-second loop, 1920x1080, 24 or 30 fps.

## Pushback prompt

Cinematic first-person view from the same airplane window seat during pushback and slow taxi. Preserve the exact dark teal cabin framing, oval window shape, seat silhouette, warm reading light, glass reflections, camera height, lens, and color grade from the boarding clip. Outside the window, terminal buildings and gate lights drift slowly backward, runway edge lights begin to pass, and the aircraft moves with subtle believable vibration and parallax. Use a dusk sky with a faint warm horizon and realistic airport distance. The motion should feel smooth, calm, and continuous, never like a handheld camera or a fast travel montage. No people, text, logos, cockpit, aircraft branding, music, or hard cuts. Realistic aviation documentary style, peaceful concentration mood, seamless 8-second loop, 1920x1080, 24 or 30 fps.

## Cruise prompt

Cinematic first-person view from the same airplane window seat at stable cruising altitude. Preserve the identical dark teal cabin frame, oval window, seat edge, warm reading light, glass reflections, camera position, lens, and restrained color grade. Outside is a vast layer of sunlit white clouds stretching to the horizon beneath a rich blue sky. Clouds move slowly and naturally below the aircraft while faint reflections travel across the window, suggesting steady flight without turbulence. The composition must feel spacious, quiet, and immersive for focused work; use gentle light changes and natural atmospheric depth rather than dramatic movement. No people, text, logos, cockpit, airline branding, music, or hard cuts. Realistic aviation documentary photography, premium calm productivity mood, locked passenger-seat camera, seamless 12-second loop, 1920x1080, 24 or 30 fps.

## Descent prompt

Cinematic first-person view from the same airplane window seat during a calm descent. Preserve the exact dark teal cabin framing, oval window, seat silhouette, warm reading light, glass reflections, camera height, lens, and visual continuity of the earlier clips. The aircraft passes slowly through thin glowing clouds; below, a coastline, rivers, soft city lights, and geometric roads gradually appear through atmospheric haze. Use warm late-afternoon light with realistic forward motion and gentle descent vibration, never a dramatic banking shot. The scene should feel like focus nearing completion: peaceful, grounded, and quietly anticipatory. No people, hands, cockpit, text, logos, airline branding, music, or hard cuts. Realistic aviation documentary style, smooth locked passenger-seat camera, seamless 8-second loop, 1920x1080, 24 or 30 fps.

## Landing prompt

Cinematic first-person view from the same airplane window seat during final approach and landing. Preserve the identical dark teal cabin frame, oval window, seat edge, warm reading light, glass reflections, camera position, lens, and color grade. Outside, runway approach lights align in the distance, airport ground slowly rises into view, and warm runway reflections pass across the glass. Suggest a gentle touchdown through a small realistic vibration near the end, but do not show the cockpit, wheels, people, or a hard cut. The emotional tone is completion and relief after a focused journey, with calm natural exposure and believable aviation movement. No text, logos, airline branding, music, or dialogue. Realistic aviation documentary look, seamless 8-second loop, 1920x1080, 24 or 30 fps.

The attached Gemini video is a 10-second master loop and is now the primary clip for the whole flight. It repeats continuously while the timer HUD marks boarding, pushback, cruise, descent, and landing independently. The phase-specific files remain available for future clip-by-clip mode; if the master file is missing, the app uses the public fallback video configured in `focus-flight/app.js`.
