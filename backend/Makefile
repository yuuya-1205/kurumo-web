.PHONY: run build test fmt vet tidy

# .env があれば読み込んでから起動する（なければ既定値で動く）
run:
	@set -a; [ -f .env ] && . ./.env || true; set +a; go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

test:
	go test ./...

fmt:
	go fmt ./...

vet:
	go vet ./...

tidy:
	go mod tidy
