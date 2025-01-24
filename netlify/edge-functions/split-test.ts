import type {Context, Config} from '@netlify/edge-functions'
export default async (request : Request, context : Context) => {
  const url = new URL(request.url)
  if (url.searchParams.get('split')) {
    return
  }
  const variantFromCookie = context.cookies.get('variant')
  function sendRewrite(variant: string) {
    if (parseFloat(variant) >= 0.5) {
      return new URL(`/branch-2/${url.pathname}?split=true`, url.origin)
    } else {
      return new URL(`/branch-3/${url.pathname}?split=true`, url.origin)
    }
  }
  if (variantFromCookie) {
    return sendRewrite(variantFromCookie)
  } else {
    const variantRandom = Math.random().toString()
    context.cookies.set({
      name: 'variant',
      value: variantRandom.toString()
    })
    return sendRewrite(variantRandom)
  }
}

export const config : Config = {
  path: '/*'
}