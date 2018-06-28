<template>
  <div class="page-container">
    <md-app>
      <md-app-toolbar class="md-primary">
        <span class="md-title">{{sitemapMeta}}</span>
      </md-app-toolbar>

      <md-app-drawer md-permanent="full">
        <md-toolbar class="md-transparent" md-elevation="0">
          Drupal Content Audit
        </md-toolbar>

        <div class="md-layout md-gutter">
            <div class="md-layout-item md-small-size-100">
              <md-field>
              <label for="sitemap">Sitemap</label>
              <md-select v-model="sitemapValue" name="sitemap" id="sitemap">
                <md-option v-for="option in sitemapOptions" v-bind:key="option.name" v-bind:value="option.name">
                  {{ option.name }}
                </md-option>
              </md-select>
            </md-field>
            </div>
          </div>

      </md-app-drawer>

      <md-app-content>

        <div class="md-layout md-gutter">
          <div class="md-layout-item">
            <md-toolbar :md-elevation="1">
              <span class="md-title">Node Type Overview</span>
            </md-toolbar>
            <canvas id="nodeChart"></canvas>
          </div>
          <md-table v-model="sitemapNodeUrls" md-card md-fixed-header>
            <md-table-toolbar>
              <h2 class="md-title">URLs</h2>
            </md-table-toolbar>

            <md-table-row slot="md-table-row" slot-scope="{ item }">
              <md-table-cell md-label="Type" md-sort-by="type" md-numeric>{{ item.type }}</md-table-cell>
              <md-table-cell md-label="URL" md-sort-by="url"><a :href="item.url">{{ item.url }}</a></md-table-cell>
            </md-table-row>
          </md-table>
        </div>

        <div class="md-layout md-gutter">
          <div class="md-layout-item">
            <md-toolbar :md-elevation="1">
              <span class="md-title">Form Type Overview</span>
            </md-toolbar>
            <canvas id="formChart"></canvas>
          </div>
          <div class="md-layout-item">
            <md-toolbar :md-elevation="1">
              <span class="md-title">Status Code Overview</span>
            </md-toolbar>
            <canvas id="statusChart"></canvas>
          </div>
        </div>

      </md-app-content>
    </md-app>
  </div>
</template>

<style lang="scss" scoped>
#app,
.page-container {
  height: 100vh;
}
.md-app {
  border: 1px solid rgba(#000, 0.12);
}

// Demo purposes only
.md-drawer {
  width: 230px;
  max-width: calc(100vw - 125px);
}
</style>

<script>
import sitemap from '../../../results/sitemap-results.json'
import { Bar, Line } from 'vue-chartjs'

export default {
  name: 'Dashboard',
  extends: Bar,
  props: {},
  data() {
    return {}
  },
  methods: {
    createChart(chartId, chartData) {
      const ctx = document.getElementById(chartId)
      const myChart = new Chart(ctx, {
        type: chartData.type,
        data: chartData.data
        // options: chartData.options
      })
    }
  },
  computed: {
    sitemapOptions: function() {
      let obj = {}
      Object.keys(sitemap).forEach((el, index) => {
        obj[index] = {
          name: el
        }
      })
      return obj
    },
    sitemapValue: {
      get: function() {
        return Object.keys(sitemap)[0]
      },
      // I have no idea.
      set: function(newVal) {
        return newVal
        console.log(newVal)
        if (this.sitemapValue !== newVal) {
          this.sitemapValue = newVal
        }
      }
    },
    sitemapNodes: function() {
      let nodeTypes = sitemap[this.sitemapValue].nodeTypes
      let chartdata = {
        type: 'bar',
        data: {
          labels: Object.keys(nodeTypes),
          datasets: [
            {
              label: 'Node Types',
              backgroundColor: '#f87979',
              data: Object.keys(nodeTypes).map(function(el, index) {
                return nodeTypes[el].count
              })
            }
          ]
        }
      }
      console.log(nodeTypes)
      return chartdata
    },
    sitemapForms: function() {
      let formTypes = sitemap[this.sitemapValue].formTypes
      let chartdata = {
        type: 'bar',
        data: {
          labels: Object.keys(formTypes),
          datasets: [
            {
              label: 'Form Types',
              backgroundColor: '#f87979',
              data: Object.keys(formTypes).map(function(el, index) {
                return formTypes[el].count
              })
            }
          ]
        },
        options: {
          responsive: true,
          lineTension: 1,
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                  padding: 25
                }
              }
            ]
          }
        }
      }
      return chartdata
    },
    sitemapStatus: function() {
      let statusCodes = sitemap[this.sitemapValue].statusCodes
      let chartdata = {
        type: 'bar',
        data: {
          labels: Object.keys(statusCodes),
          datasets: [
            {
              label: 'Status Codes',
              backgroundColor: '#f87979',
              data: Object.keys(statusCodes).map(function(el, index) {
                return statusCodes[el].count
              })
            }
          ]
        },
        options: {
          responsive: true,
          lineTension: 1,
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                  padding: 25
                }
              }
            ]
          }
        }
      }
      return chartdata
    },
    sitemapNodeUrls: function() {
      let nodeTypes = sitemap[this.sitemapValue].nodeTypes
      let arr = []
      Object.keys(nodeTypes).forEach(function(el, index) {
        nodeTypes[el].urls.forEach(function(e, i) {
          arr.push({ type: el, url: e })
        })
      })

      return arr
    },
    sitemapMeta: function() {
      let meta = this.sitemapValue
      return sitemap[this.sitemapValue].metadata.title
    }
  },
  mounted() {
    this.createChart('nodeChart', this.sitemapNodes)
    this.createChart('formChart', this.sitemapForms)
    this.createChart('statusChart', this.sitemapStatus)
  },
  metaInfo: {
    title: 'Drupal Content Audit'
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.md-layout {
  margin-bottom: 40px;
}
</style>
