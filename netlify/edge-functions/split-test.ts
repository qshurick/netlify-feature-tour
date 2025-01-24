import type {Context, Config} from '@netlify/edge-functions'
import {createClient} from '@sanity/client'

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

  async function getExperiment() {
    const client = createClient({
      projectId: "g63ug4wz",
      dataset: "production",
      useCdn: true, // set to `false` to bypass the edge cache
      apiVersion: "2023-05-03" // use current date (YYYY-MM-DD) to target the latest API version
      // token: process.env.SANITY_SECRET_TOKEN // Needed for certain operations like updating content or accessing previewDrafts perspective
    });

    const experiments = await client.fetch('*[_type == "split-test"]');

    console.log(experiments);

    return {
      isActive: experiments.length > 0,
    }
  }

  const experiment = await getExperiment();

  if (!experiment.isActive) {
    return
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