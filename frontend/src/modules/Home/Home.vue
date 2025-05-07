<template>
  <div class="list-currencies">
    <div class="item">
      <img src="../../assets/img/usd.png" alt="transaction" />
      <p>USD</p>
      <p>{{ currencies.balanceUSD }}</p>
    </div>
    <div class="item">
      <img src="../../assets/img/eur.png" alt="account" />
      <p>EUR</p>
      <p>{{ currencies.balanceEUR }}</p>
    </div>
    <div class="item">
      <img src="../../assets/img/cop.png" alt="account" />
      <p>COP</p>
      <p>{{ currencies.balanceCOP }}</p>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref } from 'vue';
  import { HomeService } from './home-service';
  import { TokenService } from '../../auth/auth-jwt-service';
  import type { Balance } from './home.interfaces';

  export default defineComponent({
    name: 'Home',
    setup() {
      const userId = ref<number>(TokenService.getClaim('sub'));
      const currencies = ref<Balance>({
        balanceUSD: 0,
        balanceCOP: 0,
        balanceEUR: 0,
      });
      const homeService = new HomeService();

      const getAmountCurrencies = async () => {
        currencies.value = await homeService.getAmountCurrencies(userId.value);
      };

      onMounted(async () => {
        await getAmountCurrencies();
      });

      return {
        currencies
      };
    },
  });
</script>

<style scoped>
  @import url(./home-styles.css);
</style>
