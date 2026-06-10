<template>
  <div class="landing-page">
    <div class="glass-panel card">
      <div class="brand">
        <span class="logo-icon">🪐</span>
        <h1 class="text-gradient">Mentimeter Clone</h1>
      </div>
      <p class="subtitle">กรอกรหัส 8 หลักเพื่อเข้าร่วมการนำเสนอแบบสด</p>

      <form @submit.prevent="joinPresentation" class="join-form">
        <div class="input-wrapper">
          <input
            v-model="rawCode"
            type="text"
            placeholder="1234 5678"
            maxlength="9"
            @input="formatCode"
            class="premium-input code-input"
            required
          />
        </div>
        <button type="submit" :disabled="loading" class="btn-primary join-btn">
          <span v-if="loading">กำลังเข้าร่วม...</span>
          <span v-else>เข้าร่วมการนำเสนอ 🚀</span>
        </button>
      </form>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="divider">
        <span>หรือ</span>
      </div>

      <div class="host-links">
        <NuxtLink to="/login" class="btn-secondary">เข้าสู่ระบบโฮสต์ (Host)</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const client = useSupabaseClient()
const router = useRouter()

const rawCode = ref('')
const loading = ref(false)
const error = ref('')

const formatCode = () => {
  // Remove non-digits
  let val = rawCode.value.replace(/\D/g, '')
  if (val.length > 4) {
    val = val.substring(0, 4) + ' ' + val.substring(4, 8)
  }
  rawCode.value = val
}

const joinPresentation = async () => {
  error.value = ''
  loading.value = true

  const code = rawCode.value.trim()
  if (code.length < 9) {
    error.value = 'กรุณากรอกรหัส 8 หลักที่ถูกต้อง'
    loading.value = false
    return
  }

  try {
    const { data, error: fetchError } = await client
      .from('presentations')
      .select('id, is_active, join_code')
      .eq('join_code', code)
      .single()

    if (fetchError || !data) {
      error.value = 'ไม่พบข้อมูลห้องนำเสนอ กรุณาตรวจสอบรหัสอีกครั้ง'
    } else {
      router.push(`/p/${data.join_code.replace(/\s+/g, '')}`)
    }
  } catch (err) {
    error.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.landing-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.card {
  width: 100%;
  max-width: 480px;
  padding: 48px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 3rem;
  animation: rotate-slow 20s linear infinite;
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.code-input {
  text-align: center;
  font-size: 1.8rem;
  letter-spacing: 0.1em;
  font-weight: 800;
  font-family: var(--font-display);
}

.join-btn {
  font-size: 1.1rem;
}

.error-msg {
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 500;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-muted);
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.divider:not(:empty)::before {
  margin-right: .5em;
}

.divider:not(:empty)::after {
  margin-left: .5em;
}

.host-links {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.host-links .btn-secondary {
  width: 100%;
}
</style>
