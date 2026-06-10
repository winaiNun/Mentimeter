<template>
  <div v-if="presentation" class="editor-page">
    <!-- Topbar -->
    <header class="topbar glass-panel">
      <div class="topbar-left">
        <NuxtLink to="/dashboard" class="btn-secondary back-btn">← แดชบอร์ด</NuxtLink>
        <div class="title-group">
          <input
            v-model="presentation.title"
            @blur="updatePresentationTitle"
            type="text"
            class="pres-title-input"
          />
          <span class="save-status" :class="{ saving: saving }">
            {{ saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลงทั้งหมดแล้ว' }}
          </span>
        </div>
      </div>
      <div class="topbar-right">
        <div class="join-info">
          <span class="label">รหัสเข้าร่วม:</span>
          <span class="code">{{ presentation.join_code }}</span>
        </div>
        <NuxtLink :to="`/presentation/${presentation.id}/present`" class="btn-primary present-btn">
          📺 นำเสนอสด
        </NuxtLink>
      </div>
    </header>

    <!-- Editor Workspace -->
    <div class="workspace">
      <!-- Left Panel: Slides List -->
      <aside class="sidebar-left glass-panel">
        <div class="panel-header">
          <h3>สไลด์</h3>
          <div class="panel-header-actions">
            <button @click="showImportModal = true" class="btn-secondary btn-sm import-btn" title="นำเข้าหลายข้อพร้อมกัน">↑ นำเข้า</button>
            <button @click="addSlide" class="btn-primary btn-sm">+ เพิ่ม</button>
          </div>
        </div>

        <div class="slides-list">
          <div
            v-for="(slide, index) in slides"
            :key="slide.id"
            :class="['slide-thumbnail', { active: activeSlideId === slide.id }]"
            @click="selectSlide(slide.id)"
          >
            <span class="slide-num">{{ index + 1 }}</span>
            <div class="thumbnail-preview">
              <span class="type-icon">{{ getTypeIcon(slide.type) }}</span>
              <p class="preview-q">{{ slide.question || 'คำถามว่างเปล่า' }}</p>
            </div>
            <button @click.stop="deleteSlide(slide.id)" class="btn-delete-slide" title="ลบสไลด์">
              🗑️
            </button>
          </div>
        </div>
      </aside>

      <!-- Center Panel: Live Preview -->
      <main class="preview-area glass-panel">
        <div class="preview-canvas">
          <div class="canvas-header">
            <span class="badge">{{ getTypeName(activeSlide?.type) }}</span>
            <span class="join-hint">เข้าเว็บ <strong>http://localhost:3000</strong> และใส่รหัส: <strong>{{ presentation.join_code }}</strong></span>
          </div>

          <div v-if="activeSlide" class="preview-content">
            <h1 class="preview-question">{{ activeSlide.question || 'พิมพ์คำถามของคุณที่นี่...' }}</h1>

            <!-- Multiple Choice / Quiz Preview -->
            <div v-if="activeSlide.type === 'multiple_choice' || activeSlide.type === 'quiz'" class="mc-preview">
              <div v-for="opt in activeSlide.options" :key="opt.id" class="mc-preview-bar-wrapper">
                <div class="mc-preview-bar">
                  <span class="label">{{ opt.text || 'ตัวเลือก' }}</span>
                  <div class="mock-bar"></div>
                  <span v-if="activeSlide.type === 'quiz'" class="quiz-indicator">
                    {{ opt.isCorrect ? '✅ คำตอบที่ถูกต้อง' : '' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Word Cloud Preview -->
            <div v-else-if="activeSlide.type === 'word_cloud'" class="cloud-preview">
              <div class="cloud-words">
                <span class="word w1">ความคิดเห็น</span>
                <span class="word w2">ข้อเสนอแนะ</span>
                <span class="word w3">โหวตสด</span>
                <span class="word w4">ไอเดีย</span>
                <span class="word w5">คำศัพท์</span>
              </div>
            </div>

            <!-- Q&A Preview -->
            <div v-else-if="activeSlide.type === 'q_and_a'" class="qa-preview">
              <div class="mock-qa-card">
                <p class="qa-text">ระบบ Realtime ของ Supabase ทำงานอย่างไรเบื้องหลัง?</p>
                <div class="qa-meta">👤 ผู้เข้าร่วมนิรนาม • 👍 12 โหวต</div>
              </div>
              <div class="mock-qa-card">
                <p class="qa-text">สามารถปรับแต่งสีสันโดยใช้ Vanilla CSS ได้ไหม?</p>
                <div class="qa-meta">👤 ผู้เข้าร่วมนิรนาม • 👍 4 โหวต</div>
              </div>
            </div>
          </div>

          <div v-else class="no-slide-state">
            <p>เลือกหรือเพิ่มสไลด์เพื่อเริ่มต้นการแก้ไข</p>
          </div>
        </div>
      </main>

      <!-- Right Panel: Configurations -->
      <aside v-if="activeSlide" class="sidebar-right glass-panel">
        <h3>ตั้งค่าสไลด์</h3>
        
        <div class="setting-group">
          <label>ประเภทสไลด์</label>
          <select v-model="activeSlide.type" @change="updateSlideType" class="premium-input select-input">
            <option value="multiple_choice">โพลหลายตัวเลือก (Multiple Choice)</option>
            <option value="word_cloud">คลาวด์คำศัพท์ (Word Cloud)</option>
            <option value="quiz">ตอบคำถามชิงรางวัล (Quiz)</option>
            <option value="q_and_a">ช่วงถาม-ตอบ (Q&A)</option>
          </select>
        </div>

        <div class="setting-group">
          <label>หัวข้อคำถาม</label>
          <textarea
            v-model="activeSlide.question"
            @input="debouncedUpdateSlide"
            class="premium-input textarea-input"
            rows="3"
            placeholder="พิมพ์คำถามของคุณที่นี่..."
          ></textarea>
        </div>

        <div class="setting-group">
          <label>⏱️ จับเวลาของสไลด์ (วินาที, 0 = ไม่จับเวลา)</label>
          <input
            v-model.number="activeSlide.settings.timer_limit"
            type="number"
            min="0"
            max="300"
            @input="debouncedUpdateSlide"
            class="premium-input"
            placeholder="ตัวอย่าง 15, 30"
          />
        </div>

        <!-- Word Cloud: allow multiple submissions toggle -->
        <div v-if="activeSlide.type === 'word_cloud'" class="setting-group">
          <label class="toggle-label">
            <span>☁️ อนุญาตให้ผู้เล่นส่งคำได้หลายครั้ง</span>
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="activeSlide.settings.allow_multiple_submissions"
                @change="debouncedUpdateSlide"
              />
              <span class="toggle-slider"></span>
            </label>
          </label>
          <p class="setting-hint">
            {{ activeSlide.settings.allow_multiple_submissions ? 'เปิด — ส่งได้ไม่จำกัด' : 'ปิด — ส่งได้ครั้งเดียวต่อคน' }}
          </p>
        </div>

        <!-- Options Configuration (Multiple Choice / Quiz / Word Cloud) -->
        <div v-if="activeSlide.type === 'multiple_choice' || activeSlide.type === 'quiz' || activeSlide.type === 'word_cloud'" class="setting-group">
          <div class="options-header">
            <label>{{ activeSlide.type === 'word_cloud' ? 'คำแนะนำให้เลือกคลิก (Suggested Tags)' : 'ตัวเลือก' }}</label>
            <button @click="addOption" class="btn-secondary btn-xs">
              {{ activeSlide.type === 'word_cloud' ? '+ เพิ่มคำแนะนำ' : '+ เพิ่มตัวเลือก' }}
            </button>
          </div>
          
          <div class="options-list">
            <div v-for="(opt, idx) in activeSlide.options" :key="opt.id" class="option-item">
              <input
                v-model="opt.text"
                @input="debouncedUpdateSlide"
                type="text"
                class="premium-input option-input"
                placeholder="ข้อความตัวเลือก"
              />
              <!-- Quiz Correct Checkbox -->
              <input
                v-if="activeSlide.type === 'quiz'"
                type="checkbox"
                v-model="opt.isCorrect"
                @change="updateCorrectOption(opt.id)"
                title="ทำเครื่องหมายเป็นคำตอบที่ถูกต้อง"
                class="quiz-checkbox"
              />
              <button @click="deleteOption(opt.id)" class="btn-delete-option" title="ลบตัวเลือก">
                ✕
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <!-- ─── Import Slides Modal ─── -->
  <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
    <div class="import-card glass-panel" @click.stop>

      <!-- Step 1: Input -->
      <template v-if="importStep === 1">
        <h2 class="import-title">📥 นำเข้าสไลด์</h2>
        <p class="import-subtitle">สร้าง Multiple Choice และ Quiz หลายข้อพร้อมกัน</p>

        <div class="import-tabs">
          <button :class="['import-tab', { active: importTab === 'paste' }]" @click="importTab = 'paste'">📋 Paste ข้อความ</button>
          <button :class="['import-tab', { active: importTab === 'csv' }]" @click="importTab = 'csv'">📄 ไฟล์ CSV</button>
        </div>

        <!-- Paste tab -->
        <div v-if="importTab === 'paste'" class="import-panel">
          <div class="format-hint">
            <p class="hint-title">รูปแบบ:</p>
            <pre class="hint-code">Q: แมวมีกี่ขา?
A) 2 ขา
B) 4 ขา *
C) 6 ขา

Q: สีของฟ้า?
A) แดง
B) น้ำเงิน *</pre>
            <p class="hint-note">ใส่ <code>*</code> ท้ายตัวเลือกที่ถูก (Quiz) • ไม่มี <code>*</code> = Poll • บรรทัดว่างคั่นแต่ละข้อ</p>
          </div>
          <textarea
            v-model="importText"
            class="import-textarea premium-input"
            placeholder="วางข้อความที่นี่..."
            rows="10"
          ></textarea>
        </div>

        <!-- CSV tab -->
        <div v-else class="import-panel">
          <button @click="downloadCSVTemplate" class="btn-secondary btn-sm">⬇️ ดาวน์โหลด Template CSV</button>
          <div class="csv-drop-area" @click="$refs.csvFileInput.click()">
            <span v-if="!csvFileName">
              📂 คลิกเพื่อเลือกไฟล์ CSV<br/>
              <small>รองรับ UTF-8 และ Excel (UTF-16 LE / BOM)</small>
            </span>
            <span v-else class="csv-file-chosen">✅ {{ csvFileName }}</span>
          </div>
          <input ref="csvFileInput" type="file" accept=".csv,.txt" style="display:none" @change="handleCSVFile" />
          <p class="hint-note">คอลัมน์: <code>ประเภท, คำถาม, ตัวเลือก1-4, คำตอบ(A/B/C/D), เวลา(วินาที)</code></p>
        </div>

        <p v-if="importError" class="import-error">⚠️ {{ importError }}</p>

        <div class="import-footer">
          <button @click="closeImportModal" class="btn-secondary">ยกเลิก</button>
          <button @click="doParseImport" :disabled="!importText.trim()" class="btn-primary">ถัดไป → ดูตัวอย่าง</button>
        </div>
      </template>

      <!-- Step 2: Preview -->
      <template v-else-if="importStep === 2">
        <h2 class="import-title">🔍 ตรวจสอบก่อนนำเข้า</h2>
        <p class="import-subtitle">
          พบ <strong>{{ parsedSlides.length }}</strong> ข้อ —
          Quiz: {{ parsedSlides.filter(s => s.type === 'quiz').length }},
          Poll: {{ parsedSlides.filter(s => s.type === 'multiple_choice').length }}
        </p>

        <div class="preview-table-wrap">
          <table class="preview-table">
            <thead>
              <tr><th>#</th><th>ประเภท</th><th>คำถาม</th><th>ตัวเลือก</th></tr>
            </thead>
            <tbody>
              <tr v-for="(s, idx) in parsedSlides" :key="idx" class="preview-row">
                <td class="col-num">{{ idx + 1 }}</td>
                <td>
                  <span :class="['type-badge', s.type === 'quiz' ? 'badge-quiz' : 'badge-poll']">
                    {{ s.type === 'quiz' ? '🏆 Quiz' : '📊 Poll' }}
                  </span>
                </td>
                <td class="col-question">{{ s.question }}</td>
                <td class="col-options">
                  <span v-for="o in s.options" :key="o.id" :class="['opt-chip', { 'opt-correct': o.isCorrect }]">
                    {{ o.text }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="import-footer">
          <button @click="importStep = 1" class="btn-secondary">← แก้ไข</button>
          <button @click="doImport" :disabled="importing" class="btn-primary import-confirm-btn">
            <span v-if="importing">กำลังสร้าง...</span>
            <span v-else>✓ นำเข้า {{ parsedSlides.length }} ข้อเลย</span>
          </button>
        </div>
      </template>

    </div>
  </div>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'

definePageMeta({
  middleware: 'auth'
})

const client = useSupabaseClient()
const route = useRoute()
const router = useRouter()

const swalDark = Swal.mixin({
  customClass: {
    popup: 'glass-panel swal-dark-popup',
    title: 'swal-dark-title',
    htmlContainer: 'swal-dark-html',
    confirmButton: 'btn-primary swal-dark-btn',
    cancelButton: 'btn-secondary swal-dark-btn'
  },
  buttonsStyling: false,
  background: 'rgba(20, 20, 35, 0.95)',
  color: '#f8fafc'
})

const presentation = ref(null)
const slides = ref([])
const activeSlideId = ref(null)
const saving = ref(false)

const activeSlide = computed(() => {
  const slide = slides.value.find(s => s.id === activeSlideId.value) || null
  if (slide && !slide.settings) {
    slide.settings = { timer_limit: 0, allow_multiple_submissions: true }
  }
  if (slide?.settings && slide.settings.allow_multiple_submissions === undefined) {
    slide.settings.allow_multiple_submissions = true
  }
  return slide
})

// Fetch presentation & slides
onMounted(async () => {
  // Fetch Presentation
  const { data: presData, error: presError } = await client
    .from('presentations')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (presError || !presData) {
    router.push('/dashboard')
    return
  }
  presentation.value = presData

  // Fetch Slides
  await fetchSlides()
})

const fetchSlides = async () => {
  const { data, error } = await client
    .from('slides')
    .select('*')
    .eq('presentation_id', route.params.id)
    .order('position', { ascending: true })

  if (!error) {
    slides.value = data
    if (data.length > 0 && !activeSlideId.value) {
      activeSlideId.value = data[0].id
    }
  }
}

const selectSlide = (id) => {
  activeSlideId.value = id
}

// Presenter changes presentation title
const updatePresentationTitle = async () => {
  if (!presentation.value.title.trim()) return
  saving.value = true
  await client
    .from('presentations')
    .update({ title: presentation.value.title })
    .eq('id', presentation.value.id)
  saving.value = false
}

// Add Slide
const addSlide = async () => {
  saving.value = true
  const newPos = slides.value.length

  const { data, error } = await client
    .from('slides')
    .insert([
      {
        presentation_id: presentation.value.id,
        type: 'multiple_choice',
        question: 'คำถามใหม่',
        options: [
          { id: 1, text: 'ตัวเลือก 1' },
          { id: 2, text: 'ตัวเลือก 2' }
        ],
        position: newPos,
        settings: { timer_limit: 0, allow_multiple_submissions: true }
      }
    ])
    .select()
    .single()

  if (!error && data) {
    slides.value.push(data)
    activeSlideId.value = data.id
  }
  saving.value = false
}

// Delete Slide
const deleteSlide = async (id) => {
  if (slides.value.length <= 1) {
    swalDark.fire({
      title: 'ไม่สามารถลบสไลด์ได้',
      text: 'ห้องนำเสนอของคุณต้องมีอย่างน้อย 1 สไลด์',
      icon: 'warning',
      confirmButtonText: 'เข้าใจแล้ว'
    })
    return
  }
  
  saving.value = true
  const { error } = await client.from('slides').delete().eq('id', id)

  if (!error) {
    const deletedIdx = slides.value.findIndex(s => s.id === id)
    slides.value = slides.value.filter(s => s.id !== id)
    
    // Select another slide
    if (activeSlideId.value === id) {
      const nextActive = slides.value[Math.max(0, deletedIdx - 1)]
      activeSlideId.value = nextActive?.id || null
    }

    // Reorder remaining slides positions
    for (let i = 0; i < slides.value.length; i++) {
      slides.value[i].position = i
      await client.from('slides').update({ position: i }).eq('id', slides.value[i].id)
    }
  }
  saving.value = false
}

// Slide type changed
const updateSlideType = async () => {
  if (!activeSlide.value) return
  saving.value = true

  const type = activeSlide.value.type
  let defaultOptions = []

  if (type === 'multiple_choice' || type === 'quiz') {
    defaultOptions = [
      { id: 1, text: 'ตัวเลือก 1', isCorrect: false },
      { id: 2, text: 'ตัวเลือก 2', isCorrect: false }
    ]
  } else if (type === 'word_cloud') {
    defaultOptions = [
      { id: 1, text: 'ยอดเยี่ยม' },
      { id: 2, text: 'สร้างสรรค์' },
      { id: 3, text: 'รวดเร็ว' }
    ]
  }

  activeSlide.value.options = defaultOptions
  await updateSlideDatabase()
}

// Slide options manage
const addOption = async () => {
  if (!activeSlide.value) return
  const newId = activeSlide.value.options.length > 0 
    ? Math.max(...activeSlide.value.options.map(o => o.id)) + 1 
    : 1
    
  activeSlide.value.options.push({
    id: newId,
    text: `ตัวเลือก ${newId}`,
    isCorrect: false
  })
  await updateSlideDatabase()
}

const deleteOption = async (optId) => {
  if (!activeSlide.value) return
  if (activeSlide.value.type !== 'word_cloud' && activeSlide.value.options.length <= 2) {
    swalDark.fire({
      title: 'ไม่สามารถลบตัวเลือกได้',
      text: 'โพลจำเป็นต้องมีอย่างน้อย 2 ตัวเลือก',
      icon: 'warning',
      confirmButtonText: 'เข้าใจแล้ว'
    })
    return
  }
  activeSlide.value.options = activeSlide.value.options.filter(o => o.id !== optId)
  await updateSlideDatabase()
}

const updateCorrectOption = async (correctOptId) => {
  if (!activeSlide.value || activeSlide.value.type !== 'quiz') return
  activeSlide.value.options.forEach(opt => {
    opt.isCorrect = opt.id === correctOptId
  })
  await updateSlideDatabase()
}

// Debounce helper for text typing
let debounceTimeout = null
const debouncedUpdateSlide = () => {
  saving.value = true
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(async () => {
    await updateSlideDatabase()
  }, 600)
}

const updateSlideDatabase = async () => {
  if (!activeSlide.value) return
  await client
    .from('slides')
    .update({
      type: activeSlide.value.type,
      question: activeSlide.value.question,
      options: activeSlide.value.options,
      settings: activeSlide.value.settings
    })
    .eq('id', activeSlide.value.id)
  saving.value = false
}

// ─── Import feature ───
const showImportModal = ref(false)
const importTab = ref('paste')
const importStep = ref(1)
const importText = ref('')
const csvFileName = ref('')
const parsedSlides = ref([])
const importError = ref('')
const importing = ref(false)
const csvFileInput = ref(null)

const closeImportModal = () => {
  showImportModal.value = false
  importStep.value = 1
  importText.value = ''
  csvFileName.value = ''
  parsedSlides.value = []
  importError.value = ''
  importing.value = false
}

// Parse quoted CSV line
const parseCSVLine = (line) => {
  const result = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { result.push(cur); cur = '' }
    else { cur += ch }
  }
  result.push(cur)
  return result
}

// Parse paste text format
const parsePasteText = (text) => {
  const slides = []
  const blocks = text.trim().split(/\n[ \t]*\n+/)

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l)
    if (lines.length < 3) continue

    // Question: first line, strip Q: / number prefix
    const question = lines[0]
      .replace(/^Q[:.]\s*/i, '')
      .replace(/^\d+[.)]\s*/, '')
      .trim()
    if (!question) continue

    const options = []
    let hasCorrect = false

    for (let i = 1; i < lines.length; i++) {
      let line = lines[i]
      let isCorrect = /\*\s*$/.test(line)
      if (isCorrect) { line = line.replace(/\s*\*\s*$/, '').trim(); hasCorrect = true }
      // Strip A) A. A: a) 1) 1. etc.
      const optText = line.replace(/^[A-Da-d1-4][.):]\s*/, '').trim()
      if (optText) options.push({ id: options.length + 1, text: optText, isCorrect })
    }

    if (options.length < 2) continue
    if (options.length > 4) options.splice(4)

    const type = hasCorrect ? 'quiz' : 'multiple_choice'
    if (!hasCorrect) options.forEach(o => delete o.isCorrect)

    slides.push({ type, question, options, settings: { timer_limit: 0, allow_multiple_submissions: true } })
  }
  return slides
}

// Parse CSV format
const parseCSV = (text) => {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  // Detect & skip header row
  const firstLow = lines[0].toLowerCase()
  const startIdx = (firstLow.includes('คำถาม') || firstLow.includes('question') || firstLow.includes('ประเภท')) ? 1 : 0

  const slides = []
  for (let i = startIdx; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cols = parseCSVLine(lines[i])
    if (cols.length < 3) continue

    let typeStr, question, opts, correctLetter, timer

    const firstLow2 = cols[0].trim().toLowerCase()
    if (firstLow2 === 'quiz' || firstLow2 === 'poll' || firstLow2 === 'multiple_choice') {
      typeStr = firstLow2 === 'poll' ? 'multiple_choice' : firstLow2
      question = cols[1]?.trim()
      opts = cols.slice(2, 6).filter(c => c.trim())
      correctLetter = cols[6]?.trim().toUpperCase() || ''
      timer = parseInt(cols[7]) || 0
    } else {
      question = cols[0]?.trim()
      opts = cols.slice(1, 5).filter(c => c.trim())
      correctLetter = cols[5]?.trim().toUpperCase() || ''
      timer = parseInt(cols[6]) || 0
      typeStr = correctLetter ? 'quiz' : 'multiple_choice'
    }

    if (!question || opts.length < 2) continue

    const correctIdx = ['A','B','C','D'].indexOf(correctLetter)
    const options = opts.slice(0, 4).map((text, idx) => ({
      id: idx + 1,
      text: text.trim(),
      isCorrect: typeStr === 'quiz' ? idx === correctIdx : undefined
    }))
    if (typeStr === 'multiple_choice') options.forEach(o => delete o.isCorrect)

    slides.push({ type: typeStr, question, options, settings: { timer_limit: timer } })
  }
  return slides
}

const doParseImport = () => {
  importError.value = ''
  const result = importTab.value === 'paste'
    ? parsePasteText(importText.value)
    : parseCSV(importText.value)

  if (result.length === 0) {
    importError.value = 'ไม่พบข้อมูลที่ถูกต้อง — ตรวจสอบรูปแบบอีกครั้ง'
    return
  }
  parsedSlides.value = result
  importStep.value = 2
}

const doImport = async () => {
  if (importing.value || parsedSlides.value.length === 0) return
  importing.value = true

  const startPos = slides.value.length
  const rows = parsedSlides.value.map((s, i) => ({
    presentation_id: presentation.value.id,
    type: s.type,
    question: s.question,
    options: s.options,
    settings: s.settings,
    position: startPos + i
  }))

  const { error } = await client.from('slides').insert(rows)

  if (error) {
    importing.value = false
    importError.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    importStep.value = 1
    return
  }

  await fetchSlides()
  // Select the first imported slide
  const firstNew = slides.value[startPos]
  if (firstNew) activeSlideId.value = firstNew.id

  closeImportModal()
  swalDark.fire({
    title: `นำเข้าสำเร็จ! 🎉`,
    text: `สร้าง ${rows.length} สไลด์ใหม่เรียบร้อยแล้ว`,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false
  })
}

const handleCSVFile = (event) => {
  const file = event.target.files[0]
  if (!file) return
  csvFileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    let text = e.target.result
    // Strip BOM (UTF-16 LE / UTF-8)
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
    importText.value = text
  }
  reader.readAsText(file, 'UTF-8')
}

const downloadCSVTemplate = () => {
  const rows = [
    'ประเภท,คำถาม,ตัวเลือก1,ตัวเลือก2,ตัวเลือก3,ตัวเลือก4,คำตอบ(A/B/C/D),เวลา(วินาที)',
    'quiz,แมวมีกี่ขา?,2 ขา,4 ขา,6 ขา,8 ขา,B,30',
    'poll,สีที่คุณชอบ?,แดง,น้ำเงิน,เขียว,เหลือง,,',
    'quiz,ไทยมีกี่จังหวัด?,72,75,77,80,C,20'
  ]
  const csv = rows.join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'quiz_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Helpers
const getTypeIcon = (type) => {
  switch (type) {
    case 'multiple_choice': return '📊'
    case 'word_cloud': return '☁️'
    case 'quiz': return '🏆'
    case 'q_and_a': return '💬'
    default: return '📄'
  }
}

const getTypeName = (type) => {
  switch (type) {
    case 'multiple_choice': return 'โพลหลายตัวเลือก'
    case 'word_cloud': return 'คลาวด์คำศัพท์'
    case 'quiz': return 'ตอบคำถาม'
    case 'q_and_a': return 'ช่วงถาม-ตอบ'
    default: return 'สไลด์'
  }
}
</script>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 16px;
  gap: 16px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-grow: 1;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-grow: 1;
}

.pres-title-input {
  background: transparent;
  border: none;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  outline: none;
  border-bottom: 2px solid transparent;
  padding: 2px 4px;
  transition: var(--transition-smooth);
  width: 100%;
  max-width: 320px;
}

.pres-title-input:focus {
  border-color: var(--color-secondary);
}

.save-status {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.save-status.saving {
  color: var(--color-warning);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.join-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.join-info .label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.join-info .code {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--color-secondary);
  font-size: 1.1rem;
  letter-spacing: 0.05em;
}

.present-btn {
  padding: 10px 20px;
  font-size: 0.9rem;
}

/* Workspace Panels */
.workspace {
  display: flex;
  flex-grow: 1;
  gap: 16px;
  min-height: 0; /* Important for flex child scrolling */
}

/* Left Sidebar (Thumbnails) */
.sidebar-left {
  width: 250px;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 1.1rem;
}

.slides-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex-grow: 1;
  padding-right: 4px;
}

.slide-thumbnail {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: var(--transition-smooth);
}

.slide-thumbnail:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
}

.slide-thumbnail.active {
  background: rgba(147, 51, 234, 0.1);
  border-color: var(--color-primary);
}

.slide-num {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.thumbnail-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex-grow: 1;
}

.type-icon {
  font-size: 1.2rem;
}

.preview-q {
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-secondary);
}

.btn-delete-slide {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 0.85rem;
  opacity: 0;
  transition: var(--transition-smooth);
}

.slide-thumbnail:hover .btn-delete-slide {
  opacity: 0.6;
}

.btn-delete-slide:hover {
  opacity: 1 !important;
}

/* Center Preview Area */
.preview-area {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
}

.preview-canvas {
  width: 100%;
  max-width: 800px;
  height: 100%;
  max-height: 500px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  background: rgba(6, 182, 212, 0.15);
  color: var(--color-secondary);
  border: 1px solid rgba(6, 182, 212, 0.3);
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.join-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.join-hint strong {
  color: var(--text-primary);
}

.preview-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
  flex-grow: 1;
  text-align: center;
}

.preview-question {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1.3;
}

.no-slide-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

/* Options/Widget Mock Previews */
.mc-preview {
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mc-preview-bar-wrapper {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  position: relative;
}

.mc-preview-bar {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 0.9rem;
}

.quiz-indicator {
  color: var(--color-success);
  font-weight: 700;
}

.cloud-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
}

.cloud-words {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: center;
  max-width: 400px;
}

.word {
  font-family: var(--font-display);
  font-weight: 800;
  opacity: 0.8;
}

.w1 { font-size: 2.2rem; color: var(--color-secondary); }
.w2 { font-size: 1.8rem; color: var(--color-accent); }
.w3 { font-size: 1.6rem; color: var(--color-primary); }
.w4 { font-size: 1.3rem; color: var(--color-success); }
.w5 { font-size: 1.1rem; color: var(--text-secondary); }

.qa-preview {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.mock-qa-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 16px;
  border-radius: 10px;
}

.qa-text {
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.qa-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Right Sidebar (Settings) */
.sidebar-right {
  width: 320px;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 20px;
  flex-shrink: 0;
}

.sidebar-right h3 {
  font-size: 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 12px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.select-input {
  background-color: var(--bg-base);
}

.textarea-input {
  resize: none;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-xs {
  padding: 6px 12px;
  font-size: 0.75rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 4px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-input {
  padding: 8px 12px;
  font-size: 0.85rem;
}

.quiz-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-success);
}

.btn-delete-option {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 4px;
  transition: var(--transition-smooth);
}

.btn-delete-option:hover {
  color: var(--color-danger);
}

/* ─── Import button ─── */
.panel-header-actions {
  display: flex;
  gap: 6px;
}

.import-btn {
  font-size: 0.72rem;
  padding: 5px 10px;
  opacity: 0.8;
}

.import-btn:hover {
  opacity: 1;
}

/* ─── Import Modal Overlay ─── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 5, 16, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.import-card {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 36px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.import-title {
  font-size: 1.6rem;
  font-weight: 800;
  font-family: var(--font-display);
}

.import-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: -12px;
}

/* Tabs */
.import-tabs {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 4px;
}

.import-tab {
  flex: 1;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.import-tab.active {
  background: rgba(147, 51, 234, 0.2);
  color: var(--text-primary);
  border: 1px solid rgba(147, 51, 234, 0.35);
}

.import-tab:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

/* Panel */
.import-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.format-hint {
  background: rgba(6, 182, 212, 0.05);
  border: 1px solid rgba(6, 182, 212, 0.15);
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hint-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.hint-code {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  white-space: pre;
}

.hint-note {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.hint-note code {
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.78rem;
}

.import-textarea {
  resize: vertical;
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  min-height: 180px;
  line-height: 1.6;
}

/* CSV drop area */
.csv-drop-area {
  border: 2px dashed rgba(147, 51, 234, 0.3);
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.8;
  transition: var(--transition-smooth);
  background: rgba(147, 51, 234, 0.03);
}

.csv-drop-area:hover {
  border-color: rgba(147, 51, 234, 0.6);
  background: rgba(147, 51, 234, 0.07);
}

.csv-drop-area small {
  font-size: 0.75rem;
  opacity: 0.7;
}

.csv-file-chosen {
  color: var(--color-success);
  font-weight: 700;
}

/* Error */
.import-error {
  color: var(--color-danger);
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 10px 16px;
  border-radius: 8px;
}

/* Footer buttons */
.import-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* Preview table */
.preview-table-wrap {
  max-height: 360px;
  overflow-y: auto;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.preview-table thead {
  position: sticky;
  top: 0;
  background: rgba(15, 15, 30, 0.95);
  backdrop-filter: blur(8px);
}

.preview-table th {
  padding: 10px 12px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.preview-row td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: top;
}

.preview-row:last-child td {
  border-bottom: none;
}

.preview-row:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.col-num {
  color: var(--text-muted);
  font-weight: 700;
  width: 32px;
}

.col-question {
  color: var(--text-primary);
  max-width: 180px;
  word-break: break-word;
}

.col-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 220px;
}

.type-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 99px;
  white-space: nowrap;
}

.badge-quiz {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.badge-poll {
  background: rgba(6, 182, 212, 0.12);
  color: var(--color-secondary);
  border: 1px solid rgba(6, 182, 212, 0.25);
}

.opt-chip {
  display: inline-block;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.opt-chip.opt-correct {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--color-success);
  font-weight: 700;
}

/* Toggle switch */
.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.1);
  border-radius: 99px;
  transition: 0.25s;
  border: 1px solid rgba(255,255,255,0.12);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 50%;
  background: #fff;
  transition: 0.25s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px) translateY(-50%);
}

.setting-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
