export function getPageForPath(pathname: string, protocol = ''): 'app' | 'landing' {
  return protocol === 'sharesafe:' || pathname === '/app' || pathname.startsWith('/app/') || (pathname.endsWith('/index.html') && protocol === 'file:') ? 'app' : 'landing'
}
