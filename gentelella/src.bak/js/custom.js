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
    let sitemap = localStorage.getItem('sitemap-select')
    if (sitemap !== 0) {
      $.ajax({
        url: '/results/' + sitemap
      }).then(function(data) {
        for (var d in data) {
          if (data.hasOwnProperty(d)) {
            switch (d) {
              case 'nodeTypes':
                updateData.nodeChart(data[d])
                break
              default:
            }
          }
        }
      })
    }
  },
  nodeChart: function(nodeTypes) {
    let cd = {
      data: {
        labels: Object.keys(nodeTypes),
        datasets: [
          {
            label: 'Node Types',
            backgroundColor: '#26B99A',
            data: Object.keys(nodeTypes).map(function(el, index) {
              return nodeTypes[el].count
            })
          }
        ]
      }
    }

    this.createChart('overview_content_types', cd.labels, cd.dataset, 'bar')
  },
  createChart: function(id, data, type) {
    if ($('#' + id).length) {
      var ctx = document.getElementById(id)
      var mybarChart = new Chart(ctx, {
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
