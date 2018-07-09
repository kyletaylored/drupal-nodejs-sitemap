/**
 * Resize function without multiple trigger
 *
 * Usage:
 * $(window).smartresize(function(){
 *     // code here
 * });
 */
;(function($, sr) {
  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function(func, threshold, execAsap) {
    var timeout

    return function debounced() {
      var obj = this,
        args = arguments
      function delayed() {
        if (!execAsap) {
          func.apply(obj, args)
        }
        timeout = null
      }

      if (timeout) {
        clearTimeout(timeout)
      } else if (execAsap) {
        func.apply(obj, args)
      }

      timeout = setTimeout(delayed, threshold || 100)
    }
  }

  // smartresize
  jQuery.fn[sr] = function(fn) {
    return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr)
  }
})(jQuery, 'smartresize')
/**
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var CURRENT_URL = window.location.href.split('#')[0].split('?')[0],
  $BODY = $('body'),
  $MENU_TOGGLE = $('#menu_toggle'),
  $SIDEBAR_FOOTER = $('.sidebar-footer'),
  $LEFT_COL = $('.left_col'),
  $RIGHT_COL = $('.right_col'),
  $NAV_MENU = $('.nav_menu'),
  $FOOTER = $('footer')

// Sidebar
$(document).ready(function() {
  // TODO: This is some kind of easy fix, maybe we can improve this
  var setContentHeight = function() {
    // reset height
    $RIGHT_COL.css('min-height', $(window).height())

    var bodyHeight = $BODY.outerHeight(),
      footerHeight = $BODY.hasClass('footer_fixed') ? -10 : $FOOTER.height(),
      leftColHeight = $LEFT_COL.eq(1).height() + $SIDEBAR_FOOTER.height(),
      contentHeight = bodyHeight < leftColHeight ? leftColHeight : bodyHeight

    // normalize content
    contentHeight -= $NAV_MENU.height() + footerHeight

    $RIGHT_COL.css('min-height', contentHeight)
  }

  // recompute content when resizing
  $(window).smartresize(function() {
    setContentHeight()
  })

  setContentHeight()
})
// /Sidebar

// Panel toolbox
$(document).ready(function() {
  $('.collapse-link').on('click', function() {
    var $BOX_PANEL = $(this).closest('.x_panel'),
      $ICON = $(this).find('i'),
      $BOX_CONTENT = $BOX_PANEL.find('.x_content')

    // fix for some div with hardcoded fix class
    if ($BOX_PANEL.attr('style')) {
      $BOX_CONTENT.slideToggle(200, function() {
        $BOX_PANEL.removeAttr('style')
      })
    } else {
      $BOX_CONTENT.slideToggle(200)
      $BOX_PANEL.css('height', 'auto')
    }

    $ICON.toggleClass('fa-chevron-up fa-chevron-down')
  })

  $('.close-link').click(function() {
    var $BOX_PANEL = $(this).closest('.x_panel')

    $BOX_PANEL.remove()
  })
})
// /Panel toolbox

var updateData = {
  getData: function() {
    let self = this
    let sitemap = localStorage.getItem('sitemap-select')
    if (sitemap !== 0) {
      $.ajax({
        url: '/results/' + sitemap
      }).then(function(data) {
        // Update metadata metrics.
        self.updateMeta(data)

        for (var d in data) {
          if (data.hasOwnProperty(d)) {
            data[d] = self.sortObject(data[d])
            switch (d) {
              case 'nodeTypes':
                self.newChart(
                  'overview_content_types',
                  'Overview of content types',
                  'Content Types',
                  data[d]
                )
                self.createDataTable('content_table', 'Content Type', data[d])
                self.createTable(
                  'content_types_sample',
                  self.getSummary(data[d])
                )
                break
              case 'formTypes':
                self.newChart(
                  'overview_form',
                  'Overview of forms',
                  'Forms',
                  data[d]
                )
                self.createDataTable('forms_table', 'Forms', data[d])
                self.createTable('forms_sample', self.getSummary(data[d]))
                break
              case 'langCodes':
                self.newChart(
                  'overview_lang',
                  'Overview of languages',
                  'Languages',
                  data[d]
                )
                break
              case 'statusCodes':
                self.newChart(
                  'overview_status',
                  'Overview of status codes',
                  'Status codes',
                  data[d],
                  'pie'
                )
                break
              default:
            }
          }
        }
      })
    }
  },
  updateMeta: function(data) {
    let meta = {
      page_count: data.metadata.pageCount,
      avg_time: data.headers.responseTimes.average,
      total_ct: Object.keys(data.nodeTypes).length,
      total_forms: Object.keys(data.formTypes).length,
      total_languages: Object.keys(data.langCodes).length,
      total_errors: Object.keys(data.statusCodes).length
    }

    // Loop through object.
    for (var value in meta) {
      if (meta.hasOwnProperty(value)) {
        $('#' + value).text(meta[value])
      }
    }
  },
  getSummary: function(data) {
    let summary = {}
    for (var value in data) {
      if (data.hasOwnProperty(value)) {
        summary[value] = {
          Name: value,
          Count: data[value].count,
          'Sample URL': data[value].urls[data[value].urls.length - 1]
        }
      }
    }
    return summary
  },
  sortObject: function(obj) {
    sorted = Object.keys(obj)
      .sort()
      .reduce(function(acc, key) {
        acc[key] = obj[key]
        return acc
      }, {})
    return sorted
  },
  createDataTable: function(id, title, data) {
    let dataset = []
    for (var ct in data) {
      if (data.hasOwnProperty(ct)) {
        data[ct].urls.forEach(url => {
          let link = '<a target="_blank" href="' + url + '">' + url + '</a>'
          dataset.push([ct, link])
        })
      }
    }
    // Check for initialized table.
    if ($.fn.dataTable.isDataTable('#' + id)) {
      $('#' + id).DataTable({
        destroy: true,
        data: dataset,
        columns: [{ title: title }, { title: 'URL' }]
      })
    } else {
      $('#' + id).DataTable({
        data: dataset,
        columns: [{ title: title }, { title: 'URL' }]
      })
    }
  },
  createTable: function(id, data) {
    // Create headers and rows
    let thead = $('<thead/>')
    let tbody = $('<tbody/>')
    let count = 0
    for (var value in data) {
      if (data.hasOwnProperty(value)) {
        let row = $('<tr/>').attr('scope', 'row')

        // Loop through each subobject
        for (var d in data[value]) {
          if (data[value].hasOwnProperty(d)) {
            if (count === 0) {
              let th = $('<th/>').html(d)
              if (d !== 'Sample URL') {
                th.attr('width', '20%')
              }
              thead.append(th)
            }
            let cell = $('<td/>').html(data[value][d])
            if (d !== 'Sample URL') {
              cell.attr('width', '20%')
            } else {
              cell.wrapInner(
                "<a target='_blank' href='" + data[value][d] + "'/>"
              )
            }
            row.append(cell)
          }
        }
        count++
        $(tbody).append(row)
      }
    }

    // Clear out old data, then append new data.
    $('#' + id)
      .html(null)
      .append(thead, tbody)
  },
  newChart: function(id, title, label, types, chart) {
    let data = {
      labels: Object.keys(types),
      datasets: [
        {
          label: label,
          backgroundColor: '#26B99A',
          data: Object.keys(types).map(function(el, index) {
            return types[el].count
          })
        }
      ]
    }
    this.createChart(id, title, data, chart)
  },
  createChart: function(id, title, data, type) {
    if ($('#' + id).length) {
      let ctx = document.getElementById(id)
      let mybarChart = new Chart(ctx, {
        type: type || 'bar',
        data: data,
        options: {
          legend: { display: true },
          title: {
            display: true,
            text: title
          },
          scales: {
            xAxes: [
              {
                ticks: {
                  callback: function(value) {
                    return value.substr(0, 10) // truncate
                  }
                }
              }
            ],
            yAxes: [
              {
                ticks: {
                  beginAtZero: true
                }
              }
            ]
          }
        }
      })
    }
  }
}

// Tooltip
$(document).ready(function() {
  $('[data-toggle="tooltip"]').tooltip({
    container: 'body'
  })

  // Why not.
  updateData.getData()

  // Fill select.
  $('select[data-source]').each(function() {
    var $select = $(this)

    $select.append('<option value="0">Select a sitemap...</option>')

    $.ajax({
      url: $select.attr('data-source')
    }).then(function(options) {
      options.map(function(option) {
        var $option = $('<option>')
        $option.val(option).text(option)
        // Check for stored value.
        if (localStorage.getItem($select.attr('id')) === option) {
          $option.attr('selected', true)
        }
        $select.append($option)
      })
    })
  })

  // Store last option.
  $('select[data-source]').on('change', function() {
    localStorage.setItem($(this).attr('id'), this.value)

    // Add update chart function.
    updateData.getData()
  })

  // Update panel hash and open to panel.
  $('.panel-nav a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
    window.location.hash = e.target.hash
  })
})
