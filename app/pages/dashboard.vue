<template>
  <div v-if="user" class="dashboard-page">
    <!-- Navbar -->
    <nav class="navbar glass-panel">
      <div class="nav-container">
        <div class="brand">
          <span class="logo">🪐</span>
          <span class="brand-name text-gradient">ระบบจัดการการนำเสนอ</span>
        </div>
        <div class="nav-user">
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleLogout" class="btn-secondary logout-btn">ออกจากระบบ 🚪</button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="dashboard-header">
        <div>
          <h2>การนำเสนอของคุณ</h2>
          <p class="subtitle">สร้างและจัดการโพลถาม-ตอบแบบเรียลไทม์ของคุณ</p>
        </div>
        <button @click="showCreateModal = true" class="btn-primary">
          <span>+ สร้างการนำเสนอใหม่</span>
        </button>
      </div>

      <!-- Presentation List Grid -->
      <div v-if="presentations.length === 0" class="empty-state glass-panel">
        <span class="empty-icon">📊</span>
        <h3>ยังไม่มีห้องนำเสนอ</h3>
        <p>สร้างสไลด์การนำเสนอแรกของคุณเพื่อเริ่มแชร์ความเห็นและมีส่วนร่วมกับผู้ฟังได้เลย!</p>
        <button @click="showCreateModal = true" class="btn-primary btn-sm">สร้างการนำเสนอทันที</button>
      </div>

      <div v-else class="presentations-grid">
        <div v-for="pres in presentations" :key="pres.id" class="glass-panel presentation-card">
          <div class="card-header">
            <h3 class="pres-title">{{ pres.title }}</h3>
            <span :class="['status-badge', pres.is_active ? 'active' : 'inactive']">
              {{ pres.is_active ? 'กำลังนำเสนอ' : 'ร่าง' }}
            </span>
          </div>

          <div class="card-details">
            <div class="detail-item">
              <span class="label">รหัสเข้าร่วม:</span>
              <span class="value code-display">{{ pres.join_code }}</span>
            </div>
            <div class="detail-item">
              <span class="label">สร้างเมื่อ:</span>
              <span class="value">{{ formatDate(pres.created_at) }}</span>
            </div>
          </div>

          <div class="card-actions">
            <NuxtLink :to="`/presentation/${pres.id}/edit`" class="btn-secondary action-btn">
              ✏️ แก้ไข
            </NuxtLink>
            <NuxtLink :to="`/presentation/${pres.id}/present`" class="btn-primary action-btn present-btn">
              📺 นำเสนอสด
            </NuxtLink>
            <button @click="deletePresentation(pres.id)" class="btn-secondary delete-btn" title="ลบการนำเสนอ">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Presentation Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="glass-panel modal-card">
        <h3>สร้างการนำเสนอใหม่</h3>
        <div class="form-group">
          <label>ชื่อหัวข้อการนำเสนอ</label>
          <input
            v-model="newTitle"
            type="text"
            placeholder="เช่น โพลตอบโต้ประจำสัปดาห์"
            class="premium-input"
            required
            @keyup.enter="createPresentation"
          />
        </div>
        <div class="modal-actions">
          <button @click="showCreateModal = false" class="btn-secondary">ยกเลิก</button>
          <button @click="createPresentation" :disabled="creating" class="btn-primary">
            <span v-if="creating">กำลังสร้าง...</span>
            <span v-else>สร้าง 🚀</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

definePageMeta({
  middleware: 'auth'
})

const client = useSupabaseClient()
const user = useSupabaseUser()
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

const presentations = ref([])
const showCreateModal = ref(false)
const newTitle = ref('')
const creating = ref(false)

onMounted(() => {
  fetchPresentations()
})

const fetchPresentations = async () => {
  const userId = user.value?.id || user.value?.sub
  const { data, error } = await client
    .from('presentations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!error) {
    presentations.value = data
  }
}

const generateJoinCode = () => {
  const digits = []
  for (let i = 0; i < 8; i++) {
    digits.push(Math.floor(Math.random() * 10))
  }
  return `${digits.slice(0, 4).join('')} ${digits.slice(4, 8).join('')}`
}

const createPresentation = async () => {
  if (!newTitle.value.trim()) return

  creating.value = true
  const joinCode = generateJoinCode()
  const userId = user.value?.id || user.value?.sub

  // Insert presentation
  const { data, error } = await client
    .from('presentations')
    .insert([
      {
        user_id: userId,
        title: newTitle.value,
        join_code: joinCode,
        is_active: false,
        current_slide_index: 0
      }
    ])
    .select()
    .single()

  if (!error && data) {
    // Also create a default first slide (Multiple choice) so presentation has content immediately
    await client.from('slides').insert([
      {
        presentation_id: data.id,
        type: 'multiple_choice',
        question: 'ภาษาโปรแกรมมิ่งที่คุณชื่นชอบมากที่สุดคืออะไร?',
        options: [
          { id: 1, text: 'JavaScript' },
          { id: 2, text: 'Python' },
          { id: 3, text: 'Rust' },
          { id: 4, text: 'Go' }
        ],
        position: 0
      }
    ])

    newTitle.value = ''
    showCreateModal.value = false
    fetchPresentations()
  }
  creating.value = false
}

const deletePresentation = async (id) => {
  const result = await swalDark.fire({
    title: 'คุณแน่ใจหรือไม่?',
    text: 'การนำเสนอและข้อมูลสไลด์ทั้งหมดจะถูกลบออกอย่างถาวร',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย! 🗑️',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true
  })

  if (result.isConfirmed) {
    const { error } = await client
      .from('presentations')
      .delete()
      .eq('id', id)

    if (!error) {
      swalDark.fire({
        title: 'ลบสำเร็จ!',
        text: 'การนำเสนอของคุณถูกลบเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง'
      })
      fetchPresentations()
    } else {
      swalDark.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถลบการนำเสนอได้',
        icon: 'error',
        confirmButtonText: 'ตกลง'
      })
    }
  }
}

const handleLogout = async () => {
  await client.auth.signOut()
  router.push('/login')
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding-bottom: 60px;
}

.navbar {
  position: sticky;
  top: 20px;
  z-index: 100;
  margin: 20px auto;
  max-width: 1200px;
  border-radius: 16px;
  padding: 16px 24px;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  font-size: 1.8rem;
}

.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  font-family: var(--font-display);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-email {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.logout-btn {
  padding: 8px 16px;
  font-size: 0.85rem;
}

.dashboard-main {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 40px;
  gap: 16px;
}

.empty-icon {
  font-size: 4rem;
}

.btn-sm {
  padding: 10px 20px;
  font-size: 0.9rem;
}

.presentations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.presentation-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.pres-title {
  font-size: 1.25rem;
  line-height: 1.4;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge.inactive {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 6px;
}

.detail-item .label {
  color: var(--text-secondary);
}

.code-display {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--color-secondary);
  letter-spacing: 0.05em;
}

.card-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  font-size: 0.9rem;
}

.present-btn {
  background: linear-gradient(135deg, var(--color-secondary) 0%, #0891b2 100%);
  box-shadow: 0 4px 15px var(--color-secondary-glow);
}

.present-btn:hover {
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.7);
}

.delete-btn {
  padding: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--color-danger);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: var(--color-danger);
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-card h3 {
  font-size: 1.4rem;
}

.modal-card .form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-card label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}
</style>
