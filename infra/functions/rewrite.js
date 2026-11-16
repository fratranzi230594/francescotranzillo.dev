// CloudFront Function (viewer-request), rendered by Terraform templatefile().
// 1. Redirects www.<domain> to the apex domain.
// 2. Maps pretty URLs to the files Astro builds: /it/ -> /it/index.html, /blog/post -> /blog/post/index.html
function handler(event) {
  var request = event.request;
  var apex = '${apex_domain}';
  var host = request.headers.host ? request.headers.host.value : '';

  if (apex && host === 'www.' + apex) {
    var qs = Object.keys(request.querystring)
      .map(function (k) {
        return k + '=' + request.querystring[k].value;
      })
      .join('&');
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://' + apex + request.uri + (qs ? '?' + qs : '') } },
    };
  }

  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.split('/').pop().indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }
  return request;
}
