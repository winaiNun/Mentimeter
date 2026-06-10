<template>
  <div class="auth-page">
    <div class="glass-panel card">
      <div class="header">
        <NuxtLink to="/" class="back-link">← กลับไปยังหน้ากรอกรหัส</NuxtLink>
        <h1 class="text-gradient">สมัครบัญชีโฮสต์</h1>
        <p class="subtitle">สร้างบัญชีผู้ควบคุมเพื่อเริ่มต้นสร้างกิจกรรมของคุณ</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>อีเมล (Email Address)</label>
          <input
            v-model="email"
            type="email"
            placeholder="name@domain.com"
            class="premium-input"
            required
          />
        </div>

        <div class="form-group">
          <label>รหัสผ่าน (Password)</label>
          <input
            v-model="password"
            type="password"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            class="premium-input"
            minlength="6"
            required
          />
        </div>

        <button type="submit" :disabled="loading" class="btn-primary auth-btn">
          <span v-if="loading">กำลังสมัครสมาชิก...</span>
          <span v-else>สมัครสมาชิก ✨</span>
        </button>
      </form>

      <p v-if="error" class="error-msg">{{ error }}</p>
      <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>

      <div class="footer-links">
        <p>มีบัญชีอยู่แล้วใช่หรือไม่? <NuxtLink to="/login" class="link-text">เข้าสู่ระบบ</NuxtLink></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const client = useSupabaseClient()
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

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const successMsg = ref('')

const handleRegister = async () => {
  error.value = ''
  successMsg.value = ''
  loading.value = true

  const { data, error: authError } = await client.auth.signUp({
    email: email.value,
    password: password.value,
  })

  if (authError) {
    loading.value = false
    swalDark.fire({
      title: 'สมัครสมาชิกไม่สำเร็จ ❌',
      text: authError.message === 'User already registered'
        ? 'อีเมลนี้มีผู้ใช้งานแล้วในระบบ'
        : authError.message,
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  } else {
    loading.value = false
    swalDark.fire({
      title: 'สมัครสมาชิกสำเร็จ! 🎉',
      text: 'ระบบกำลังนำคุณไปยังหน้าจัดการระบบ...',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
    if (data?.user) {
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    }
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.card {
  width: 100%;
  max-width: 480px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-link {
  color: var(--text-secondary);
  font-size: 0.85rem;
  align-self: flex-start;
  transition: var(--transition-smooth);
}

.back-link:hover {
  color: var(--color-secondary);
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.auth-btn {
  margin-top: 10px;
  font-size: 1rem;
}

.error-msg {
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

.success-msg {
  color: var(--color-success);
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

.footer-links {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.link-text {
  color: var(--color-secondary);
  font-weight: 600;
}

.link-text:hover {
  text-decoration: underline;
}
</style>
