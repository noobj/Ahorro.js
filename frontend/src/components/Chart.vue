<script>
import { Pie, mixins } from "vue-chartjs";
const { reactiveProp } = mixins;

export default {
  extends: Pie,
  mixins: [reactiveProp],
  mounted() {
    // Overwriting base render method with actual data.
    this.renderChart(this.chartData, {
      responsive: true,
    });
  },
};
</script>
