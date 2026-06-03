FROM rust:1.88-bookworm AS builder
WORKDIR /app
COPY . .
RUN cargo build --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/sdkwork-magic-studio-server /usr/local/bin/sdkwork-magic-studio-server
EXPOSE 4318
CMD ["/usr/local/bin/sdkwork-magic-studio-server"]
