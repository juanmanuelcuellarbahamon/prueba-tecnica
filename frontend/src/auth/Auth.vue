<template>
  <div class="auth-bg">
    <form class="form-auth" @submit.prevent="handleSubmit">
      <div class="logo-container">
        <img src="../assets/img/bancolombia.png" alt="logo" />
      </div>
      <Input
        v-model="formData.email"
        label="Correo"
        icon="email"
        type="text"
        placeholder="Digita tu correo"
        :errorMessage="getErrorMessage(v$.formData.email)"
      />
      <Input
        v-model="formData.password"
        label="Contraseña"
        type="password"
        icon="lock"
        placeholder="Digita tu contraseña"
        :errorMessage="getErrorMessage(v$.formData.password)"
      />
      <p class="old-login">
        ¿No tienes una cuenta?
        <a @click="goToRegister">Entra Aca</a>
      </p>
      <Button
        icon="login"
        type="submit"
        :fullWidth="true"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Cargando...' : 'Ingresar' }}
      </Button>
    </form>
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, reactive, ref } from 'vue';
  import { useVuelidate } from '@vuelidate/core';
  import { required, minLength, helpers, email } from '@vuelidate/validators';
  import { getErrorMessage } from '../utils/validationUtils';
  import { login } from './auth-service';

  import { useRouter } from 'vue-router';
  import Button from '../shared/Button/Button.vue';
  import Input from '../shared/Input/Input.vue';
  import Swal from 'sweetalert2';

  export default defineComponent({
    components: {
      Button,
      Input,
    },
    setup() {
      const router = useRouter();
      const formData = reactive({
        email: '',
        password: '',
      });
      const isLoading = ref(false);

      const goToRegister = () => {
        router.push({ name: 'register' });
      };

      const rules = {
        formData: {
          email: {
            required: helpers.withMessage('El correo es requerido', required),
            email: helpers.withMessage('El correo no es válido', email),
          },
          password: {
            required: helpers.withMessage(
              'La contraseña es requerida',
              required
            ),
            minLength: helpers.withMessage(
              'La contraseña debe tener al menos 6 caracteres',
              minLength(6)
            ),
          },
        },
      };

      const v$ = useVuelidate(rules, { formData });

      const handleSubmit = async () => {
        const isValid = await v$.value.$validate();
        if (!isValid) return;

        isLoading.value = true;

        try {
          await login(formData);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Usuario ingresado correctamente',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          router.push({ name: 'home' });
        } catch (error) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'El usuario o contraseña no es correcto',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        } finally {
          isLoading.value = false;
        }
      };

      onMounted(() => {
        localStorage.removeItem('USER_FORM');
      });

      return {
        formData,
        v$,
        handleSubmit,
        getErrorMessage,
        isLoading,
        goToRegister,
      };
    },
  });
</script>

<style scoped>
  @import url(./auth-styles.css);
</style>
