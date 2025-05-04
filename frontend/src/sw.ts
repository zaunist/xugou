/// <reference lib="webworker" />

// 导出空对象以满足 TypeScript 的模块要求
export {}

declare const self: ServiceWorkerGlobalScope

self.addEventListener('install', () => {
  console.log('Service worker 安装完成')
})

self.addEventListener('activate', () => {
  console.log('Service worker 已激活')
})

self.addEventListener('fetch', (event) => {
  // 网络优先策略
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            // 如果缓存中有匹配的响应，则返回缓存的响应
            if (cachedResponse) {
              return cachedResponse;
            }
            // 如果缓存中没有匹配的响应，则返回一个默认的离线页面或错误响应
            return new Response('网络请求失败，且缓存中没有匹配的资源', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          })
      })
  )
})