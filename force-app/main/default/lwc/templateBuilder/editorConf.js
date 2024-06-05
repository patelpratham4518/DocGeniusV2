import {customeIcons} from 'c/utilityProperties';
var thisTemplate;
var ListOfFielMappingKeys;
export function intializeSummerNote(temp, document, docGeniusLogoSvg, editorSelector){
    try { 
            var note = {
              summerNote: null ,
              selector: null ,
              noteEditorFrame: null ,
            }

            thisTemplate = temp;
            note.selector = editorSelector;
            note.summerNote =  thisTemplate.querySelector(`[data-name="${note.selector}"]`);

            // Create new fontResize Custom BUTTON....
            var fontResizerBtn = function (context) {
                return createFontResizer(note, context);
            }

            var createBuilderTitle = function(context){
                // var titleDiv = `<div class="docGeniusLogo">Template</br> Builder</div>`;
                var titleImg = `<div class="docGeniusLogo"><img src=${docGeniusLogoSvg}></img></div>`
                return titleImg;
            }
            
            var rowcolorbtn = function(context){
                return createRowColorBtn(note, context)
            }

            var borderColorBtn = function(context){
              return createBorderColorBtn(note, context)
            }

            var cellColorBtn = function(context){
              return createCellColorBtn(note, context)
            }

            var cellVerticalAlignBtn = function(context){
              return createCellVerticalAlignBtn(note, context);
            };

            var truncateBtn = function(context){
              return createTruncateBtn(note, context);
            }

            var pageSetupBtn = function(context){
              return createPageSetupBtn(note, context)
            }

            // Initalize SummerNote Editor...
            $(note.summerNote).summernote({
    
                editing: true,
                // placeholder: 'Welcome To The DocGenius Template Builder. A Place Where You Can Create Your Amazing Documentation...',
                styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                fontSizes: ['8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','26','28','30','32','34','36','38','40','42','44','46','48','52','56','60','64','68','72','76','80','86','92','98'],
                fontNames: ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Helvetica', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana'],
                addDefaultFonts : true,
                  tableClassName: 'table table-bordered',
                  insertTableMaxSize: {
                    col: 10,
                    row: 10,
                  },
                toolbar: [

                  // Customized Toolbar 
                  ['custom_backup', ['undo','redo']],
                  ['custom_pageSetup', ['pageSetup']],
                  ['custom_fontFormattings', ['fontname', 'fontsize', 'fontResizer','forecolor', 'backcolor', 'bold','italic', 'underline', 'strikethrough','superscript', 'subscript']],
                  ['custom_paragraphFormatting', ['ul', 'ol', 'paragraph', 'height']],
                  ['custom_style', ['style']],
                  ['custom_insert', ['table','link', 'picture', 'hr']],
                  ['custom_clearFormatting', ['truncate','clear']],
                  ['custom_view', ['fullscreen', 'help']],
                  // ['custom_decisions', ['setdecisionBtns']],
                  ['custom_title', ['titleBtn']],

                ],
                popover: {
                    image: [
                        ['image', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
                        ['float', ['floatLeft', 'floatRight', 'floatNone']],
                        ['remove', ['removeMedia']]
                      ],
                      link: [
                        ['link', ['linkDialogShow', 'unlink']]
                      ],
                      table: [
                        ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
                        ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
                        ['tablerowcolor', ['setTableRowColor']],
                        ['tablebordercolor', ['setTableBorder']],
                        ['tablecellcolor', ['setTableCellColor']],
                        ['cellVerticalAlightn', ['setCellVeticalAlign']],
                        ['merge', ['jMerge']],
                        ['style', ['jBackcolor', 'jBorderColor', 'jAlign']],
                        ['info', ['jTableInfo']],
                        // ['delete', ['jWidthHeightReset', 'deleteTable']],
                      ],
                },
                buttons : {
                    fontResizer : fontResizerBtn,
                    setTableRowColor : rowcolorbtn,
                    setTableBorder : borderColorBtn,
                    setTableCellColor : cellColorBtn,
                    setCellVeticalAlign : cellVerticalAlignBtn,
                    titleBtn : createBuilderTitle,
                    truncate : truncateBtn,
                    pageSetup : pageSetupBtn,
                },
                tabsize: 2,
                disableResizeEditor: true,
                blockquoteBreakingLevel: 2,
                dialogsInBody : true,
                dialogsFade : false,
                disableDragAndDrop : false,
                shortcuts : true,
                tabDisable : false,
                codeviewFilter: false,
                codeviewIframeFilter: true,   
                toolbarPosition: 'top',
                spellCheck: true,
                disableGrammar: false,
                maximumImageFileSize: null,
                acceptImageFileTypes: "image/*",
                allowClipboardImagePasting: true,

                icons: {
                    'align': customeIcons.alignjustify,
                    'alignCenter': customeIcons.aligncenter,
                    'alignJustify': customeIcons.alignjustify,
                    'alignLeft': customeIcons.alignleft,
                    'alignRight': customeIcons.alignleft,
                    'rowBelow': 'note-icon-row-below',
                    'colBefore': 'note-icon-col-before',
                    'colAfter': 'note-icon-col-after',
                    'rowAbove': 'note-icon-row-above',
                    'rowRemove': 'note-icon-row-remove',
                    'colRemove': 'note-icon-col-remove',
                    'indent': 'note-icon-align-indent',
                    'outdent': 'note-icon-align-outdent',
                    'arrowsAlt': customeIcons.fullScreen2,
                    'bold': customeIcons.bold2,
                    'caret': 'note-icon-caret',
                    'circle': 'note-icon-circle',
                    'close': 'note-icon-close',
                    'code': 'note-icon-code',
                    'eraser': customeIcons.clearFormat2,
                    'floatLeft': 'note-icon-float-left',
                    'floatRight': 'note-icon-float-right',
                    'font': customeIcons.fontColor2,
                    'frame': 'note-icon-frame',
                    'italic': customeIcons.italic2,
                    'link': customeIcons.link,
                    'unlink': customeIcons.unlink,
                    'magic': 'note-icon-magic',
                    'menuCheck': 'note-icon-menu-check',
                    'minus': 'note-icon-minus',
                    'orderedlist': customeIcons.orderedlist,
                    'pencil': 'note-icon-pencil',
                    'picture': customeIcons.image2,
                    'question': customeIcons.help,
                    'redo': 'note-icon-redo',
                    'rollback': 'note-icon-rollback',
                    'square': 'note-icon-square',
                    'strikethrough': customeIcons.strikethrough2,
                    'subscript': customeIcons.subscript,
                    'superscript': customeIcons.superscript,
                    'table': customeIcons.table2 ,
                    'textHeight': customeIcons.lineHeight2,
                    'trash': 'note-icon-trash',
                    'underline': customeIcons.underline2,
                    'undo': 'note-icon-undo',
                    'unorderedlist': customeIcons.unorderedlist,
                    'video': 'note-icon-video',
                    'rowcolor' : customeIcons.rowcolor + 'Row Color',
                    'cellcolor' : customeIcons.cellColor + 'Cell Color',
                    'bordercolor' : customeIcons.tableBorder + 'Border',
                  },

                callbacks: {
                    onBeforeCommand: null,
                    onBlur: null,
                    onBlurCodeview: null,
                    onChange: function(contents, context, $editable){
                        setFontResizerValue(note);
                        // setFieldNameTagging(note, $editable);
                        
                    },
                    onChangeCodeview: null,
                    onDialogShown: null,
                    onEnter: null,
                    onFocus: null,
                    onImageLinkInsert: null,
                    onImageUpload: null,
                    onImageUploadError: null,
                    onInit: function(){
                        // Method to set CSS of HTML Elements Once Editor Load SuccessFully...
                        setCSSAfterLoadEditor(thisTemplate, note);
                    },
                    onKeydown: null,
                    onKeyup: null,
                    onMousedown: null,
                    onMouseup: function(e) {
                        setFontResizerValue(note);
                    },
                    onPaste: function(event){

                      // Get the clipboard data from the paste event
                      var clipboardData = event.originalEvent.clipboardData || window.clipboardData

                      // Retrieve text and HTML content from the clipboard
                      var plainText = clipboardData.getData('text/plain');
                      console.log('plainText : ', plainText);
                      var htmlText = clipboardData.getData('text/html');
                      console.log('htmlText : ', htmlText);

                      // Regular expression to match patterns like {{#sometext}}
                      var regex = /\{\{#([^{}]+)\}\}/g;

                      var inputString = htmlText || plainText; 
                      var modifedString = null;
                      // Loop through matches
                      var match;
                      while ((match = regex.exec(inputString)) !== null) {
                        modifedString = inputString.replace(match[0], `<b class="fieldKey" data-field="key">${match[0]}</b>`);   
                      }

                      if(modifedString){
                          // event.preventDefault();
                          // $(note.summerNote).summernote('editor.pasteHTML', modifedString);
                          // $(note.summerNote).summernote('editor.afterCommand');
                      }

                    },
                    onScroll: null,
                  },
            });

            return true;
    } catch (error) {
        console.warn('error in editorConfig.intializeSummerNote : ', error.stack);
        return false;
    }
}

// Method to set CSS of HTML Elements Once Editor Load SuccessFully...
function setCSSAfterLoadEditor(thisTemplate, note){
  try {
    note.noteEditorFrame = note.summerNote.nextSibling;
    note.noteEditorFrame.setAttribute('data-zone', note.selector);

    // var toobarHeight = note.noteEditorFrame.querySelector('.note-toolbar') ? note.noteEditorFrame.querySelector('.note-toolbar').getBoundingClientRect().height : 64;
    // toobarHeight = toobarHeight == 0 ? 64 : toobarHeight;
    // note.noteEditorFrame.style =  note.noteEditorFrame.style.cssText + `padding-top : calc(${toobarHeight}px + 1rem);`;

    const page = note.noteEditorFrame.querySelector('.note-editable');
    page.setAttribute('data-editor', note.selector);
    // There is some issue or bug in summerNote js that not make editor enable...
    // So we make it using our logic....
    page.setAttribute('contenteditable', 'true');

    if(note.selector == 'footerEditor'){
        note.noteEditorFrame.style = note.noteEditorFrame.style.cssText + `position : static;`;
        note.noteEditorFrame.classList.add('footerEditorFrame');
        var toolbar = note.noteEditorFrame.querySelector('.note-toolbar');
        toolbar.style = 'display : none;';
        $(document).on("click", function(event){
            toggleToolBar(event, toolbar, page)
          }
        );
    }

  } catch (error) {
    console.warn('error in setCSSAfterLoadEditor : ', error.stack);
  }
}

function toggleToolBar(event, cur_toolbar, cru_page ){
  try {
      if(!$(event.target).closest(cru_page).length && 
        !$(event.target).closest(cur_toolbar).length){
        cur_toolbar.style = 'display : none;';
      }
      else{
        cur_toolbar.style = '';
      }
  } catch (error) {
    console.warn('error in editorConfig.toggleToolBar : ', error.stack);
  }
}


// *** ======== ===== ======  Set Font Size Using Custom Button -- START ======== ===== ====== ========

// Method to create and return custom fontResize BUTTON....
function createFontResizer(note, context){
        var fontReiszerContanier = document.createElement('div');
        fontReiszerContanier.classList.add('fontResizer');
    
        var minusBtn = document.createElement('span');
        minusBtn.classList.add('minusBtn');
        minusBtn.setAttribute("data-name", "font-minus");
        // minusBtn.innerText = 'A-';
        minusBtn.innerHTML = customeIcons.minusSize
        minusBtn.addEventListener('click', function(e){setFontSize(e, note)});
        fontReiszerContanier.appendChild(minusBtn);
    
        var sizeInput = document.createElement('input');
        sizeInput.setAttribute("type", "text");
        sizeInput.setAttribute("data-name", "font-input");
        sizeInput.value=13;
        sizeInput.classList.add('sizeInput');
        sizeInput.addEventListener('change', function(e){setFontSize(e, note)});
        sizeInput.addEventListener('focus', function(e){setFontSize(e, note)});
        sizeInput.addEventListener('keypress', function(e){setFontSize(e, note)});
        fontReiszerContanier.appendChild(sizeInput);
    
        var plusBtn = document.createElement('span');
        plusBtn.classList.add('plusBtn');
        plusBtn.addEventListener('click', function(e){setFontSize(e, note)});
        // plusBtn.innerText = 'A+';
        plusBtn.innerHTML = customeIcons.plusSize
        plusBtn.setAttribute("data-name", "font-plus");
        fontReiszerContanier.appendChild(plusBtn);
        
        var ui = $.summernote.ui;
        // create button
        var button = ui.button({
            contents: fontReiszerContanier,
            tooltip: 'Set font-size',
            click: function () {
            // invoke insertText method with 'hello' on editor module.
            }
        });
        return button.render();   // return button as jquery object
}
// Method to Set Font-Size in Editor...
function setFontSize(event, note){
   
    // get Editor CurrentStyle;
    var styleInfo = $(note.summerNote).summernote('editor.currentStyle');

    // When User Click MINUS Button...
    if(event.currentTarget.dataset.name == 'font-minus'){
      note.summerNote.nextSibling.querySelector(`[data-name="font-input"]`).value = parseInt(styleInfo['font-size'] - 1);
        $(note.summerNote).summernote('fontSize', parseInt(styleInfo['font-size'] - 1));
    }
    // When User Click PLUS Button...
    else if(event.currentTarget.dataset.name == 'font-plus'){
      note.summerNote.nextSibling.querySelector(`[data-name="font-input"]`).value =  parseInt(styleInfo['font-size']) + 1;
        $(note.summerNote).summernote('fontSize', parseInt(styleInfo['font-size']) + 1);
    }
    // When USer Interact with Inut Field...
    else if(event.currentTarget.dataset.name == 'font-input'){
        // Save selection range before click on input
        $(note.summerNote).summernote('saveRange'); 

        // When User Focus on Input... Select all value...
        if(event.type == 'focus'){
            this.select();
        }
        //When User Chnage Value Of Font-Size Input...         
        else if(event.type == 'change'){
            var inputValue = event.target.value;
            if(inputValue > 100){
                inputValue = 100;
            }
            else if(inputValue <= 0){
                inputValue = 2;
            }

            // restore selection range before apply font-size;
            $(note.summerNote).summernote('restoreRange');
            // Apply Font-size as per User Defiend Value...
            $(note.summerNote).summernote('fontSize', parseInt(inputValue));
            event.target.value = parseInt(inputValue);
        }
        // Prevent User to enter non-numeric value...
        else if(event.type == 'keypress'){
          const keyCode = event.which || event.keyCode;
      
          if (keyCode < 48 || keyCode > 57) {
            event.preventDefault();
          }
        }
        
    }
}
// Method to  // set font-resiz input value as per selectd text font-size...
// this mehtod will triggers when user change mouse postion OR editor value changed...
function setFontResizerValue(note){
    try {
        // get Editor CurrentStyle;
        var styleInfo = $(note.summerNote).summernote('editor.currentStyle');

        var fontResizer = note.summerNote.nextSibling.querySelector(`[data-name="font-input"]`);
        if(fontResizer){
            fontResizer.value = styleInfo['font-size'];
        }
    } catch (error) {
        console.warn('error in editorConfig.setFontResizerValue : ', );
    }
}
// ======== ===== ====== Set Font Size Using Custom Button  - END ======== ===== ====== ========

// *** ======== ===== ====== Set Table Row Color Custom Button -- START ======== ===== ====== ========

// Method to create custom Button to set Table Row Color
function createRowColorBtn(note, context){
    var defaultColor = '#ffffff';
    return colorPalette_CusBtn('row-color', 'rowcolor', defaultColor, 'Select Row Colors', setTableRowColor, note, context);
}
// Method to set Table row color
function setTableRowColor(color, note, context) {
  try {
      // Check if selection is inside a table row
      var editable = context.layoutInfo.editable;
      var rng = context.invoke('createRange', editable);
  
      if (!rng.isOnCell()) {
          return;
      }
      // Get the table row
      var $tr = $(rng.sc).closest('tr');
      // Set background color of the table row
      $tr.css('background-color', color);
  } catch (error) {
      console.warn('error in setTableRowColor : ', error.stack);
      
  }
};

// Method to create custom Button to set Table Border Color
function createBorderColorBtn(note, context){
  var defaultColor = '#000000';
  return colorPalette_CusBtn('border-color', 'bordercolor', defaultColor, 'Select Border Colors', setTableBorderColor , note, context);
}
// Method to set Table Border color
function setTableBorderColor(color, note, context) {
  try {
      // Check if selection is inside a table row
      var editable = context.layoutInfo.editable;
      var rng = context.invoke('createRange', editable);
      // const rng = $(note.summerNote).summernote('editor.getLastRange');
  
      if (!rng.isOnCell()) {
          return;
      }
  
      // Set background color of the table td and th
      $(rng.sc).closest('table').find('td', 'th').css('border-color' , color);
  } catch (error) {
      console.warn('error in setTableRowColor : ', error.stack);
      
  }
  };

// Method to create custom Button to set Table Single Cell Color
function createCellColorBtn(note, context){
  var defaultColor = '#ffffff';
  return colorPalette_CusBtn('cell-color', 'cellcolor', defaultColor, 'Select Cell Colors', setTableCellColor, note, context);
}
// Method to set Table Cell color
function setTableCellColor(color, note, context) {
try {
    // Check if selection is inside a table row
    var editable = context.layoutInfo.editable;
    var rng = context.invoke('createRange', editable);
    // const rng = $(note.summerNote).summernote('editor.getLastRange');

    if (!rng.isOnCell()) {
        return;
    }

    // Get the table row
    var $td = $(rng.sc).closest('td');
    var $th = $(rng.sc).closest('td');
    if ($td.length > 0){
      $td.css('background-color', color);
    }
    else if($th.length > 0){
      $th.css('background-color', color);
    }
} catch (error) {
    console.warn('error in setTableRowColor : ', error.stack);
    
}
}


// Method to create a button with custom color palette dropdown... 
// this method is replicated from summerNote JS File, so be carefull to made any changes....
function colorPalette_CusBtn(className, infoOpt, defaultColor, PaletTitle, callBackFnc, note, context){

        var ui = $.summernote.ui;
        var options = context.options;
        var lang = context.options.langInfo;
        return ui.buttonGroup({
          className: 'note-color ' + className,
          tooltip : lang.custom[infoOpt],
          children : [
            ui.button({
              className: 'dropdown-toggle setMaxWidth',
              contents: options.icons[infoOpt],
              data: {
                toggle: 'dropdown',
              },
            }),
            ui.dropdown({
              items:[
                '<div class="note-palette">',
                  '<div class="note-palette-title">' + PaletTitle + '</div>',
                  '<div>',
                    '<button type="button" class="note-color-reset btn btn-light btn-default" data-event="'+ 'selectionEvent' +'" data-value="transparent">',
                      lang.color.transparent,
                    '</button>',
                  '</div>',
                  '<div class="note-holder" data-event="'+ 'selectionEvent' +'"><!-- Select colors --></div>',
                  '<div>',
                    '<button type="button" class="note-color-select btn btn-light btn-default" data-event="openPalette" data-value="colorPicker-'+options.id+'">',
                      lang.color.cpSelect,
                    '</button>',
                    '<input type="color" id="colorPicker-'+options.id+'" class="note-btn note-color-select-btn" value="' + defaultColor + '" data-event="recentColors-'+options.id+'">',
                  '</div>',
                  '<div class="note-holder-custom" id="recentColors-'+options.id+'" data-event="'+ 'selectionEvent' +'"></div>',
                '</div>',
              ].join(''),
              callback: ($dropdown) => {
                $dropdown.find('.note-holder').each((idx, item) => {
                  const $holder = $(item);
                  $holder.append(ui.palette({
                    colors: options.colors,
                    colorsName: options.colorsName,
                    eventName: $holder.data('event'),
                    container: options.container,
                    tooltip: options.tooltip,
                  }).render());
                });
                /* TODO: do we have to record recent custom colors within cookies? */
                var customColors = [
                  ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
                ];
                $dropdown.find('.note-holder-custom').each((idx, item) => {
                  const $holder = $(item);
                  $holder.append(ui.palette({
                    colors: customColors,
                    colorsName: customColors,
                    eventName: $holder.data('event'),
                    container: options.container,
                    tooltip: options.tooltip,
                  }).render());
                });
                $dropdown.find('input[type=color]').each((idx, item) => {
                    $(item).on("change", function() {
                    const $parent = $('.' + className).find('.note-dropdown-menu');
                    const $palette = $($parent.find('#' + $(this).data('event')).find('.note-color-row')[0]);
                    const $chip = $palette.find('.note-color-btn').last().detach();
                    const color = this.value.toUpperCase();
                    $chip.css('background-color', color)
                        .attr('aria-label', color)
                        .attr('data-value', color)
                        .attr('data-original-title', color);
                    $chip.trigger('click');
                    $palette.prepend($chip);

                    // Set Color Based On Color-Picker Value;
                    callBackFnc(color, note, context);
                  });
                });
              },
              click: (event) => {
                event.stopPropagation();
      
                const $parent = $('.' + className).find('.note-dropdown-menu');
                const $button = $(event.target);
                const eventName = $button.data('event');
                const value = $button.attr('data-value');
      
                if (eventName === 'openPalette') {
                  const $picker = $parent.find('#' + value);
                  const $palette = $($parent.find('#' + $picker.data('event')).find('.note-color-row')[0]);
      
                  // Shift palette chips
                  const $chip = $palette.find('.note-color-btn').last().detach();
      
                  // Set chip attributes
                  const color = $picker.val();
                  $chip.css('background-color', color)
                    .attr('aria-label', color)
                    .attr('data-value', color)
                    .attr('data-original-title', color);
                  $palette.prepend($chip);
                  $picker.trigger('click');
                
                  // Set Color Based On Color-Picker Value;
                  callBackFnc(color, note, context);
                } 
                else{
                  //  if(eventName === selectionEvent ){
                    // Set color based on color selection....                  
                    callBackFnc(value, note, context);
                  //  }
                }
              },
            }),
          ],
        }).render();
}

 // ======== ====== ====== Set Table Row Color Custom Button - END ======== ===== ====== ========

 function createCellVerticalAlignBtn(note, context){
      
        var ui = $.summernote.ui;
        var options = context.options;
        var lang = context.options.langInfo;
        lang.topAlign = 'Top Align';
        lang.bottomAlign = 'Bottom Align';
        lang.centerAlign = 'Center Align';
        lang.baselineAlign = 'Baseline Align';

        return ui.buttonGroup([
              ui.button({
                  className: 'dropdown-toggle',
                  contents : ui.dropdownButtonContents(ui.icon(options.icons.alignLeft), options),
                  tooltip  : lang.verticalAlign,
                  container: options.container,
                  data     : {
                      toggle: 'dropdown',
                  },
              }),
              ui.dropdown({
                className: 'custom-align-dropdown',
                children : [
                      ui.button({
                          className: 'custom-vertical-align-btn-top',
                          // contents : ui.icon(options.icons.alignJustify),
                          contents : customeIcons.aligntop,
                          tooltip  : lang.topAlign,
                          click: function () {setCellVerticalAlighn('top', context)}
                      }),
                      ui.button({
                          className: 'custom-vertical-align-btn-middle',
                          // contents : ui.icon(options.icons.alignJustify),
                          contents : customeIcons.alignmiddle,
                          tooltip  : lang.centerAlign,
                          click: function () {setCellVerticalAlighn('middle', context)}
                      }),
                      ui.button({
                          className: 'custom-vertical-align-btn-bottom',
                          // contents : ui.icon(options.icons.alignJustify),
                          contents : customeIcons.alignbottom,
                          tooltip  : lang.bottomAlign,
                          click: function () {setCellVerticalAlighn('bottom', context)}
                      }),
                      ui.button({
                          className: 'custom-vertical-align-btn-baseline',
                          contents : customeIcons.aligntop,
                          tooltip  : lang.baselineAlign,
                          click: function () {setCellVerticalAlighn('baseline', context)}
                      })
                  ]
              }),
            
        ]).render();
 }

 function setCellVerticalAlighn(position, context){
  try {
        // Check if selection is inside a table row
        var editable = context.layoutInfo.editable;
        var rng = context.invoke('createRange', editable);
        // const rng = $(note.summerNote).summernote('editor.getLastRange');
    
        if (!rng.isOnCell()) {
            return;
        }
    
        // Get the table row
        var $td = $(rng.sc).closest('td');
        var $th = $(rng.sc).closest('td');
        if ($td.length > 0){
          $td.css('vertical-align', position);
        }
        else if($th.length > 0){
          $th.css('vertical-align', position);
        }
  } catch (error) {
    console.warn('error in setCellVerticalAlighn : ', error.stack);
    
  }
 }

//  ==== ===== ======= ====== Page Setup Methods ==== ==== ==== ==== 
function createPageSetupBtn(note, context){
  var ui = $.summernote.ui;
  var options = context.options;
  var lang = options.langInfo;
  lang.pageSetup = 'Page Configurations';

    return ui.buttonGroup([
      ui.button({
        className : 'pageSetup-toggle',
        contents : customeIcons.pageSetup,
        tooltip : lang.pageSetup,
        data : {
            toggle : 'dropdown'
        }
      }),
      ui.dropdown({
        className: 'pageSetupOptions',
        items : [
          generatePageSetupOptions()
        ].join(''),
        callback: ($dropdown) => {
          var setupCloseBtn = $dropdown.find('.setupCloseBtn');
          $(setupCloseBtn).on('click', function(event){
            event.preventDefault();
            var  pageSetupToggle = note.noteEditorFrame.querySelector('.pageSetup-toggle');
            pageSetupToggle.classList.remove('active');
            pageSetupToggle.parentNode.classList.remove('open');
          })

          var radioBtns = $dropdown.find('input[type=radio]');
          radioBtns.each((ele, item) => {
            $(item).on('click', function(event){
              console.log(event.target.dataset.size);
            });
          })
        },
        click: (event) => {
          event.preventDefault();
          event.stopPropagation();
        }
      })
    ]).render();
}

  function generatePageSetupOptions(){
    return `
            <div class="setupContainer">
                <div class="setupContainer_sub">
                    <div class="setUpTitleSection">
                        <div class="setUpTitle">Page Configuraions</div>
                        <div class="setupCloseBtn">
                            <svg viewBox="0 0 24 24" fill="currentColor" lwc-1tsr6p0f0fe=""><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z" lwc-1tsr6p0f0fe=""></path></svg>
                        </div>
                    </div>
                    <div class="setUpOptions">
                        <div class="bodyMarginSetup setupOption">
                            <div class="optionTitle">Page Margin</div>
                            <div class="setUpIcon"><svg class="msIcon" viewBox="0,0,2048,2048" ><path type="path" class="OfficeIconColors_HighContrast" d="M 256 128 h 1472 v 1792 h -1472 m 1088 -1728 h -704 v 256 h 704 m -704 64 v 1024 h 704 v -1024 m -1024 -320 v 256 h 256 v -256 m -256 320 v 1024 h 256 v -1024 m -256 1344 h 256 v -256 h -256 m 320 256 h 704 v -256 h -704 m 1024 256 v -256 h -256 v 256 m 256 -320 v -1024 h -256 v 1024 m 256 -1088 v -256 h -256 v 256 z"></path><path type="path" class="OfficeIconColors_m20" d="M 1693 1888 h -1405 v -1728 h 1405 z"></path><path type="path" class="OfficeIconColors_m22" d="M 256 128 h 1472 v 1792 h -1472 m 1408 -64 v -1664 h -1344 v 1664 z"></path><path type="path" class="OfficeIconColors_m24" d="M 1408 512 v 1024 h 256 v 64 h -256 v 256 h -64 v -256 h -704 v 256 h -64 v -256 h -256 v -64 h 256 v -1024 h -256 v -64 h 256 v -256 h 64 v 256 h 704 v -256 h 64 v 256 h 256 v 64 m -320 0 h -704 v 1024 h 704 z"></path></svg></div>
                            <div class="setUpinputs">
                                <div class="inputContainer">
                                    <div class="inputLabel">Left:</div>
                                    <input type="number" class="pageMarginInput" value="0.5" max="10" data-margin="left" data-name="pageMargin"/>
                                </div>
                                <div class="inputContainer">
                                    <div class="inputLabel">Right:</div>
                                    <input type="number" class="pageMarginInput" value="0.5" max="10" data-margin="right" data-name="pageMargin"/>
                                </div>
                                <div class="inputContainer">
                                    <div class="inputLabel">Top:</div>
                                    <input type="number" class="pageMarginInput" value="0.5" max="10" data-margin="top" data-name="pageMargin"/>
                                </div>
                                <div class="inputContainer">
                                    <div class="inputLabel">Bottom</div>
                                    <input type="number" class="pageMarginInput" value="0.5" max="10" data-margin="bottom" data-name="pageMargin"/>
                                </div>

                            </div>
                        </div>
                        <div class="pageOriantationSetup setupOption">
                            <div class="optionTitle">Page Oriantion</div>
                            <div class="setUpIcon"><svg class="msIcon" viewBox="0,0,2048,2048" ><path type="path" class="OfficeIconColors_HighContrast" d="M 512 1920 v -1024 h 1024 l 384 384 v 640 m -384 -933 v 293 h 293 m -357 64 v -384 h -896 v 896 h 1280 v -512 m -1408 192 h -320 v -1408 h 639 l 385 384 v 320 h -64 v -256 h -384 v -384 h -512 v 1280 h 256 m 320 -960 h 293 l -293 -293 z"></path><path type="path" class="OfficeIconColors_m20" d="M 448 1504 h -288 v -1344 h 597 l 363 363 v 309 h -672 m 1440 450 v 606 h -1344 v -960 h 986 z"></path><path type="path" class="OfficeIconColors_m22" d="M 512 1920 v -1024 h 1024 l 384 384 v 640 m -384 -933 v 293 h 293 m -357 64 v -384 h -896 v 896 h 1280 v -512 m -1408 192 h -320 v -1408 h 639 l 385 384 v 320 h -64 v -256 h -384 v -384 h -512 v 1280 h 256 m 320 -960 h 293 l -293 -293 z"></path></svg></div>
                            <div class="setUpinputs oriantationInputs">
                                <div class="inputContainer">
                                    <input type="radio" checked="checked" name="pageOriantation" value="portrait" data-oriantation="portrait"  />
                                    <div class="inputLabel">Portrait</div>
                                </div>
                                <div class="inputContainer">
                                    <input type="radio" checked="checked" name="pageOriantation" value="landscape" data-oriantation="landscape" />
                                    <div class="inputLabel">Landscape</div>
                                </div>
                            </div>
                        </div>
                        <div class="pageSizeSetup setupOption">
                            <div class="optionTitle">Page Size</div>
                            <div class="setUpIcon"><svg class="msIcon" viewBox="0,0,2048,2048" ><path type="path" class="OfficeIconColors_HighContrast" d="M 1536 896 v 1024 h -1088 v -1472 h 640 m 0 448 h 352 l -352 -348 m 384 412 h -448 v -448 h -512 v 1344 h 960 m 64 -1728 v 192 h -64 v -64 h -960 v 64 h -64 v -192 h 64 v 64 h 960 v -64 m -1344 320 h 192 v 64 h -64 v 1344 h 64 v 64 h -192 v -64 h 64 v -1344 h -64 z"></path><path type="path" class="OfficeIconColors_m20" d="M 1066 480 l 438 421 v 992 h -1029 v -1413 z"></path><path type="path" class="OfficeIconColors_m22" d="M 1536 896 v 1024 h -1088 v -1472 h 640 m 0 448 h 352 l -352 -348 m 384 412 h -448 v -448 h -512 v 1344 h 960 z"></path><path type="path" class="OfficeIconColors_m24" d="M 1536 128 v 192 h -64 v -64 h -960 v 64 h -64 v -192 h 64 v 64 h 960 v -64 m -1344 320 h 192 v 64 h -64 v 1344 h 64 v 64 h -192 v -64 h 64 v -1344 h -64 z"></path></svg>                            </div>
                            <div class="setUpinputs sizeInputs">
                                <div class="inputContainer">
                                    <input type="radio" checked="checked" name="pageSize" value="A4" data-size="A4"  />
                                    <div class="inputLabel">A4<span class="subLabel">(8.27" x 11.69")</span></div>
                                </div>
                                <div class="inputContainer">
                                    <input type="radio" checked="checked" name="pageSize" value="A3" data-size="A3"  />
                                    <div class="inputLabel">A3<span class="subLabel">(8.27" x 11.69")</span></div>
                                </div>                                <div class="inputContainer">
                                    <input type="radio" checked="checked" name="pageSize" value="A5" data-size="A5"  />
                                    <div class="inputLabel">A5<span class="subLabel">(8.27" x 11.69")</span></div>
                                </div>
                                <div class="inputContainer">
                                    <input type="radio" checked="checked" name="pageSize" value="Letter" data-size="Letter"  />
                                    <div class="inputLabel">Letter<span class="subLabel">(8.27" x 11.69")</span></div>
                                </div>                                <div class="inputContainer">
                                    <input type="radio" checked="checked" name="pageSize" value="Legal" data-size="Legal"  />
                                    <div class="inputLabel">Legal<span class="subLabel">(8.27" x 11.69")</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    `;
  }

 function createTruncateBtn(note, context){
    var ui = $.summernote.ui;
    var options = context.options;
    // var lang = context.options.langInfo;
    // lang.truncate = 'Truncate Text';
    var editable = context.layoutInfo.editable;

    return ui.button({
        // className: 'truncate-btn',
        contents : customeIcons.truncate,
        // tooltip  : lang.truncate,
        click: function (context) {
          // var rng = context.invoke('createRange', editable);
          // console.log('rng : ', rng.toString());
          // console.log(editable.text());
          $(note.summerNote).summernote('saveRange'); 
          setFieldNameTagging(note, context);
          $(note.summerNote).summernote('restoreRange'); 
        }
    }).render();
 }

 export function setFieldMappingKeyisConfig(fielMappingKeysList){
    try{
      ListOfFielMappingKeys = fielMappingKeysList;
    }
    catch(error){
      console.warn('error in editorConfig > setFieldMappingKeyisConfig : ', error.stack);
    }
 }

 function setFieldNameTagging(note, context){
  try {
      var pattern = /{{#(.*?)}}/;
      var makeActive;

      if(!note.noteEditorFrame.querySelector('.truncate-btn').classList.contains('active')){
        note.noteEditorFrame.querySelector('.truncate-btn').classList.add('active');
        makeActive = true;
      }
      else{
        note.noteEditorFrame.querySelector('.truncate-btn').classList.remove('active');
        makeActive = false;
      }

      var editor = note.noteEditorFrame.querySelector(`[data-editor="${note.selector}"]`);
      function transverNode(node){
        if(node.childNodes){
          for (var i = 0; i < node.childNodes.length; i++) {
            var ele = node.childNodes[i];
              var matcher = pattern.exec(ele.innerText);
              if(matcher !== null && ListOfFielMappingKeys.includes(matcher[1])){
                ele.innerHTML = ele.innerHTML.replace(matcher[0], `<span class="field-mapping">${matcher[0]}</span>`);
              }
          }
        }
     }

     if(makeActive){
       transverNode(editor);
     }
     else{
        var fieldMapping = editor.querySelectorAll('.field-mapping');
        if(fieldMapping.length){
          for (var i = 0; i < fieldMapping.length; i++) {
            var ele = fieldMapping[i];
            var textNode = document.createTextNode(ele.innerText)
            ele.parentNode.replaceChild(textNode, ele)
          }
        }
     }

  } catch (error) {
    console.warn('error in editorConfig > setFieldNameTagging : ', error.stack);
  }
 }