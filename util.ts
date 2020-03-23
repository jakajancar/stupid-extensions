export function resolve(path: string, current: string): string {
    if (path.endsWith('.ts'))
        return path;
    else if (path.endsWith('.js'))
        return path;
    else if (path === '.')
        return `./index.${current}`
    else if (path === '..')
        return `../index.${current}`
    else
        return path + `.${current}`
}

export function createRegexp(): RegExp {
    return /((import|export)( [\s\w\r\n\*\{\},]+ from)?|declare module) ['"](?<path>.*?)(?<after>['"])/g
}

export interface Import {
    offset: number
    path: string
}

export interface ImportMap {
    [path: string]: string
}

export function findImports(source: string): Import[] {
    const ret: Import[] = []
    const pattern = createRegexp()
    let match;
    while (match = pattern.exec(source)) {
        let path = match.groups!['path']
        ret.push({ offset: pattern.lastIndex - match.groups!['after'].length - path.length, path })
    }
    return ret
}

export function replaceImports(source: string, imports: Import[], map: ImportMap): string {
    let offset, path, newPath, growth = 0
    for ({offset, path} of imports) {
        newPath = map[path]
        source = source.slice(0, offset + growth) + newPath + source.slice(offset + growth + path.length)
        growth += newPath.length
        growth -= path.length
    }
    return source
}
