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

  <!-- Second Autocomplete for Users -->
  <Autocomplete
    id="destination-user"
    label="Usuario Destino"
    :suggestions="users"
    :displayKey="'email'"
    placeholder="Buscar usuario destino..."
    mode="single"
    v-model="selectedDestinationUser"
  />

  <Input
    label="Monto"
    id="amount"
    type="number"
    placeholder="0.00"
    v-model="transferAmount"
  />

  <Button type="button" :full-width="true" icon="check" @click="onSubmit">
    Confirmar
  </Button>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import Input from '../../shared/Input/Input.vue';
  import Autocomplete from '../../shared/Autocomplete/Autocomplete.vue';
  import Button from '../../shared/Button/Button.vue';
  import { showToast } from '../../shared/Toast/toast-service';
  import { fetchUsers } from '../../auth/auth-service';
  import { WithdrawFundsService } from './withdraw-funds-service';

  export default defineComponent({
    name: 'WithdrawFunds',
    components: {
      Input,
      Autocomplete,
      Button,
    },
    setup() {
      const transferAmount = ref<string>('');
      const users = ref<any[]>([]);
      const selectedSourceAccount = ref<any>(null);
      const selectedDestinationUser = ref<any>(null);

      onMounted(async () => {
        try {
          const fetchedUsers = await fetchUsers();
          users.value = fetchedUsers;
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      });

      const withdrawFundsService = new WithdrawFundsService();

      const sourceAccounts = ref([
        { id: 1, name: 'USD', value: 'USD' },
        { id: 2, name: 'COP', value: 'COP' },
      ]);

      const clearForm = () => {
        transferAmount.value = '';
        selectedSourceAccount.value = sourceAccounts.value[0];
        selectedDestinationUser.value = null;
      };

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

          if (!selectedDestinationUser.value) {
            showToast('Debe seleccionar un usuario destino.', 'error');
            return;
          }

          const selectedCurrency = selectedSourceAccount.value.value;

          const body = {
            amount: Number(transferAmount.value),
            currency: selectedCurrency,
            accountId: 0,
          };

          withdrawFundsService.withdrawFunds(
            body,
            selectedDestinationUser.value.id
          );

          const message = `Fondos quitados a la cuenta: ${selectedDestinationUser.value.email} ${body.amount} ${body.currency}.`;

          showToast(message, 'success');

          console.log(body);

          clearForm();
        } catch (error) {
          showToast('Hubo un problema al realizar la transferencia.', 'error');
          console.error('Error during transfer:', error);
        }
      };

      return {
        sourceAccounts,
        users,
        selectedSourceAccount,
        selectedDestinationUser,
        transferAmount,
        onSubmit,
      };
    },
  });
</script>

<style scoped>
  /* @import url(./withdraw-styles.css); */
</style>
