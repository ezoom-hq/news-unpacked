import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/news-unpacked/', // TODO: GitHubのリポジトリ名に合わせて変更してください
})
