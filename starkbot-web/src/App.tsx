import { Routes, Route } from 'react-router-dom'
import Home from './views/Home'
import BrandKit from './views/BrandKit'
import StarkLicense from './views/StarkLicense'

// Import markdown docs as components
import DocsOverview from './pages/docs/overview.md'
import DocsGettingStarted from './pages/docs/getting-started.md'
import DocsArchitecture from './pages/docs/architecture.md'
import DocsApi from './pages/docs/api.md'
import DocsTools from './pages/docs/tools.md'
import DocsSkills from './pages/docs/skills.md'
import DocsChannels from './pages/docs/channels.md'
import DocsScheduling from './pages/docs/scheduling.md'
import DocsMemories from './pages/docs/memories.md'
import DocsConfiguration from './pages/docs/configuration.md'
import DocsTelegram from './pages/docs/telegram.md'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/brand-kit" element={<BrandKit />} />
      <Route path="/starklicense" element={<StarkLicense />} />
      <Route path="/docs" element={<DocsOverview />} />
      <Route path="/docs/getting-started" element={<DocsGettingStarted />} />
      <Route path="/docs/architecture" element={<DocsArchitecture />} />
      <Route path="/docs/api" element={<DocsApi />} />
      <Route path="/docs/tools" element={<DocsTools />} />
      <Route path="/docs/skills" element={<DocsSkills />} />
      <Route path="/docs/channels" element={<DocsChannels />} />
      <Route path="/docs/scheduling" element={<DocsScheduling />} />
      <Route path="/docs/memories" element={<DocsMemories />} />
      <Route path="/docs/configuration" element={<DocsConfiguration />} />
      <Route path="/docs/telegram" element={<DocsTelegram />} />
    </Routes>
  )
}

export default App
