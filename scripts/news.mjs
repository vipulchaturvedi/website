import { resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'
import fg from 'fast-glob'

async function findLatestNews(newsFolder, year) {
  const entriesMap = new Map()
  const entries = await fg('*.md', { cwd: resolve(newsFolder, year), onlyFiles: true })
  // remove excluded files
  return [
    entriesMap,
    entries.filter(n => n[0] !== '_').filter(n => n[0] !== '_').map((n) => {
      if (/^[0-9]+\.md$/.test(n)) {
        entriesMap.set(n, n)
        return n
      }
      else {
        const [day, month] = n.split('.')
        const name = `${Date.UTC(year, month, day, 0, 0, 0, 0)}.md`
        entriesMap.set(name, n)
        return name
      }
    }).sort().reverse(),
  ]
}
async function generateYearNews(newsFolder, year) {
  const [entriesMap, entries] = await findLatestNews(newsFolder, year)

  const newsContent = `---
editLink: false
---
<!-- DO NOT EDIT THIS PAGE IT IS AUTOGENERATED -->

# Iconify Updates ${year}

${entries.map(n => `<!--@include: ./${year}/${entriesMap.get(n)}-->`).join('\n')}
`

  await writeFile(resolve(newsFolder, `${year}.md`), newsContent, 'utf-8')
}

function generateNewsIndex(newsFolder, years) {
  const newsList = `<!-- DO NOT EDIT THIS PAGE IT IS AUTOGENERATED -->
# Iconify Updates

Iconify updates can be found in the following pages:

${years.sort().reverse().map(y => `- [Year ${y}](./${y})`).join('\n')}`

  return writeFile(resolve(newsFolder, 'index.md'), newsList, 'utf-8')
}

async function generateLatestNews(newsFolder, years) {

}

function generateNewsNavbar(rootFolder, years) {
  const newsNavigationContent = `// DO NOT EDIT THIS PAGE IT IS AUTOGENERATED
import type { DefaultTheme } from 'vitepress'

export const NewsSidebar: DefaultTheme.SidebarItem[] = [
  { text: 'Getting Started', link: '/getting-started' },
  {
    text: 'Iconify Updates',
    link: '/news/',
    items: [
      ${years.sort().reverse().map(y => `{ text: 'Year ${y}', link: '/news/${y}' }`).join(',\n      ')},
    ],
  },
]
`

  return writeFile(resolve(rootFolder, '.vitepress/news-navigation.ts'), newsNavigationContent, 'utf-8')
}

const rootFolder = process.cwd()
const newsFolder = resolve(rootFolder, 'news')

const years = await fg('*', { cwd: newsFolder, deep: 1, onlyDirectories: true })

await Promise.all([
  generateNewsNavbar(rootFolder, years),
  generateLatestNews(newsFolder, years),
  ...years.map(y => generateYearNews(newsFolder, y)),
  generateNewsIndex(newsFolder, years),
])