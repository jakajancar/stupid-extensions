const { test } = Deno
import { assertMatch, assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { createRegexp, resolve } from './util.ts'

test(function testRegExp(): void {
    assertMatch(`import * from "./file";`, createRegexp())
    assertMatch(`import * from './file';`, createRegexp())
    assertMatch(`import { foo, bar } from './file';`, createRegexp())
    assertMatch(`import { foo as foo2, bar as bar2 } from './file';`, createRegexp())
    assertMatch(`import { foo as foo2, } from './file';`, createRegexp())
    assertMatch("import { \nfoo as foo2, bar\nbaz\n} from './file';", createRegexp())
    assertMatch(`import d from './file';`, createRegexp())
    assertMatch(`import * as foo from './file';`, createRegexp())
    assertMatch(`import './foo';`, createRegexp())
    assertMatch(`declare module './foo' {`, createRegexp())
    assertEquals(null, createRegexp().exec('import Either = E.Either'))
})

test(function testResolve(): void {
    assertEquals(resolve('.', 'ts'), './index.ts')
    assertEquals(resolve('..', 'ts'), '../index.ts')
    assertEquals(resolve('../foo', 'ts'), '../foo.ts')
    assertEquals(resolve('./foo', 'ts'), './foo.ts')
    assertEquals(resolve('./foo/bar', 'ts'), './foo/bar.ts')

    assertEquals(resolve('./foo', 'ts'), './foo.ts')
    assertEquals(resolve('./foo', 'js'), './foo.js')
    assertEquals(resolve('./foo.ts', 'ts'), './foo.ts')
    assertEquals(resolve('./foo.js', 'ts'), './foo.js')
    assertEquals(resolve('./foo.js', 'js'), './foo.js')
    assertEquals(resolve('./foo.ts', 'js'), './foo.ts')
})
