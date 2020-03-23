import { serve, ServerRequest, Response } from 'https://deno.land/std/http/server.ts'
import * as flags from 'https://deno.land/std/flags/mod.ts'
import { createRegexp, resolve, Import, ImportMap, findImports, replaceImports } from './util.ts'

const DEFAULT_PORT = 8000;
const argPort = flags.parse(Deno.args).port;
const port = argPort ? Number(argPort) : DEFAULT_PORT;

const s = serve({ port })
console.log(`Listening on port ${port}`)
for await (const req of s) {
    handleRequest(req)
        .then(res => req.respond(res))
        .catch(reason => req.respond({ status: 500, body: reason+'' }))
}

async function handleRequest(req: ServerRequest): Promise<Response> {
    if (req.method !== 'GET')
        return { status: 405 }

    const url = new URL(req.url, 'https://' + req.headers.get('host'))
    if (url.pathname === '/')
        return { body: `Will append .ts/.js to ES6 imports.\n\nInvoke as:\nhttps://${url.hostname}/some-domain.com/some/path/to/file.(ts|js)` }
    if (!url.pathname.endsWith('.js') && !url.pathname.endsWith('.ts'))
        return { status: 400, body: 'URL pathname must end with .js or .ts' }
    const ext = url.pathname.slice(-2)

    const fwdUrl = 'https:/' + url.pathname
    const res = await fetch(fwdUrl)
    if (res.status !== 200)
        return { status: res.status, body: `${fwdUrl} returned ${res.status}` }

    const source = await res.text()
    const imports = findImports(source)
    const paths = Array.from(new Set(imports.map(i => i.path)))
    const newPathPromises = paths.map(path => transformPath(fwdUrl, path, ext))
    const newPaths = await Promise.all(newPathPromises)
    const map: ImportMap = {}
    for (let i in paths) {
        map[paths[i]] = newPaths[i]
    }
    const transformed = replaceImports(source, imports, map)

    if (url.searchParams.has('debug')) {
        return { body: JSON.stringify({imports, map}) }
    } else {
        return { body: transformed }
    }
}


async function transformPath(context: string, path: string, ext: string): Promise<string> {
    return resolve(path, ext)
    // const resolved = new URL(newPath, context) + ''
    // if (await exists(resolved)) {
    //   console.log(`In '${context}': path '${path}' mapped to '${newPath}' and '${resolved}' exists`)
    //   return newPath
    // } else {
    //   console.log(`In '${context}': path '${path}' mapped to '${newPath}' but '${resolved}' doesn't exist`)
    //   throw new Error(`${context} imported from '${path}', but ${resolved} does not exist.`)
    // }
}

// async function exists(url: string) {
//     const attempt = await fetch(url)
//     return attempt.status === 200
// }
