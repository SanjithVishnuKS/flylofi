import zipfile, struct

with zipfile.ZipFile(r'd:\SERVER APP\focus-flight.apk', 'r') as z:
    dex = z.read('classes.dex')

string_ids_size, string_ids_off = struct.unpack_from('<II', dex, 56)
type_ids_size, type_ids_off = struct.unpack_from('<II', dex, 64)
method_ids_size, method_ids_off = struct.unpack_from('<II', dex, 88)

def read_uleb128(data, off):
    result, shift = 0, 0
    while True:
        b = data[off]; off += 1; result |= (b & 0x7f) << shift
        if (b & 0x80) == 0: break
        shift += 7
    return result, off

def get_str(str_id):
    if str_id >= string_ids_size: return f'<invalid str_id {str_id}>'
    off = struct.unpack_from('<I', dex, string_ids_off + str_id*4)[0]
    l, o = read_uleb128(dex, off)
    return dex[o:o+l].decode('utf-8', errors='ignore')

# Find string id of local_sites
target_id = None
for i in range(string_ids_size):
    off = struct.unpack_from('<I', dex, string_ids_off + i*4)[0]
    l, o = read_uleb128(dex, off)
    if dex[o:o+l] == b'local_sites':
        target_id = i
        break

print('String ID of local_sites:', target_id)

# Find where it's used
target = struct.pack('<H', target_id)
pos = 0
while True:
    pos = dex.find(target, pos)
    if pos == -1: break
    print(f'Offset: {hex(pos)}, preceding op: {hex(dex[pos-1])} {hex(dex[pos-2])}')
    # Print 40 bytes around it
    print(dex[pos-10:pos+30])
    pos += 1
