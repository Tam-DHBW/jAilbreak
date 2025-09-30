function handler(event) {
    let request = event.request

    request.uri = request.uri.replace(/^\/api/, '')

    return request
}
