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
            switch (d) {
              case 'nodeTypes':
                self.newChart(
                  'overview_content_types',
                  'Content Types',
                  data[d]
                )
                self.createTable('content_table', 'Content Type', data[d])
                break
              case 'formTypes':
                self.newChart('overview_form', 'Forms', data[d])
                break
              case 'langCodes':
                self.newChart('overview_lang', 'Languages', data[d])
                break
              case 'statusCodes':
                self.newChart('overview_status', 'Status codes', data[d])
                break
              default:
            }
          }
        }
      })
    }
  },
  updateMeta: function(data) {
    $('#page_count').text(data.metadata.pageCount)
    $('#avg_time').text(data.headers.responseTimes.average)
    $('#total_ct').text(Object.keys(data.nodeTypes).length)
    $('#total_forms').text(Object.keys(data.formTypes).length)
    $('#total_languages').text(Object.keys(data.langCodes).length)
    $('#total_errors').text(Object.keys(data.statusCodes).length)
  },
  createTable: function(id, title, data) {
    let dataset = []
    for (var ct in data) {
      if (data.hasOwnProperty(ct)) {
        data[ct].urls.forEach(url => {
          dataset.push([ct, `<a href="${url}">${url}</a>`])
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
  newChart: function(id, label, types) {
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
    this.createChart(id, data, 'bar')
  },
  createChart: function(id, data, type) {
    if ($('#' + id).length) {
      let ctx = document.getElementById(id)
      let mybarChart = new Chart(ctx, {
        type: type || 'bar',
        data: data,
        options: {
          scales: {
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
})
