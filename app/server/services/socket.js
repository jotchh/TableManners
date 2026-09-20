export function createSocket() {
    return new WebSocket(`ws://${window.location.host}`);
}
