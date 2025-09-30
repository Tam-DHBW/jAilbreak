function handler(event) {
    let request = event.request

    request.uri = "/index.html"

    return request
}
