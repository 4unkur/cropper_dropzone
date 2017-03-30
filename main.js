// transform cropper dataURI output to a Blob which Dropzone accepts
var dataURItoBlob = function (dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: 'image/jpeg'});
};

Dropzone.autoDiscover = false;
var storage = [];

var myDropzone = new Dropzone("#my-dropzone-container", {
    autoProcessQueue: false,
    addRemoveLinks: true,
    parallelUploads: 1,
    uploadMultiple: false,
    maxFiles: 10,
    init: function () {

        this.on('addedfile', function (file) {
            if (!file.cropped) {
                var index = storage.push(file) - 1;
                var $button = $('<a href="#" class="js-open-cropper-modal" data-file-index="' + index + '">Crop & Upload</a>');
                $(file.previewElement).append($button);
            }
        });

        this.on('thumbnail', function (file) {
            if (file.cropped || !file.show_modal) {
                return;
            }

            var $img = $('<img>');

            // cache filename to re-assign it to cropped file
            var cachedFilename = file.name;
            // remove not cropped file from dropzone (we will replace it later)
            this.removeFile(file);

            // dynamically create modals to allow multiple files processing
            // modal window template
            var modalTemplate =
                '<div class="modal fade" tabindex="-1" role="dialog">' +
                    '<div class="modal-dialog modal-lg" role="document">' +
                        '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                            '<h4 class="modal-title">Crop</h4>' +
                        '</div>' +
                        '<div class="modal-body">' +
                            '<div class="image-container"></div>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                            '<button type="button" class="btn btn-warning rotate-left"><span class="fa fa-rotate-left"></span></button>' +
                            '<button type="button" class="btn btn-warning rotate-right"><span class="fa fa-rotate-right"></span></button>' +
                            '<button type="button" class="btn btn-warning scale-x" data-value="-1"><span class="fa fa-arrows-h"></span></button>' +
                            '<button type="button" class="btn btn-warning scale-y" data-value="-1"><span class="fa fa-arrows-v"></span></button>' +
                            '<button type="button" class="btn btn-warning reset"><span class="fa fa-refresh"></span></button>' +
                            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
                            '<button type="button" class="btn btn-primary crop-upload">Crop & upload</button>' +
                        '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            var $cropperModal = $(modalTemplate);

            // initialize FileReader which reads uploaded file
            var reader = new FileReader();
            reader.onloadend = function () {
                // add uploaded and read image to modal
                $cropperModal.find('.image-container').html($img);
                $img.attr('src', reader.result);
            };
            // read uploaded file (triggers code above)
            reader.readAsDataURL(file);

            var cropper = {};
            $cropperModal
                .modal('show')
                .on("shown.bs.modal", function () {
                    cropper = new Cropper($img.get(0), {
                        autoCropArea: 1,
                        movable: false,
                        cropBoxResizable: true,
                        rotatable: true
                    });
                })
                .on('click', '.crop-upload', function () {
                    // get cropped image data
                    var blob = cropper.getCroppedCanvas().toDataURL();
                    // transform it to Blob object
                    var newFile = dataURItoBlob(blob);
                    // set 'cropped to true' (so that we don't get to that listener again)
                    newFile.cropped = true;
                    // assign original filename
                    newFile.name = cachedFilename;

                    // add cropped file to dropzone
                    myDropzone.addFile(newFile);
                    // rearrange files so the cropped file will be in the first position
                    // as processQueue() method processes from first element of an array
                    myDropzone.rearrangeFiles();
                    // upload cropped file with dropzone
                    myDropzone.processQueue();
                    $cropperModal.modal('hide');
                })
                .on('click', '.rotate-right', function () {
                    cropper.rotate(90);
                })
                .on('click', '.rotate-left', function () {
                    cropper.rotate(-90);
                })
                .on('click', '.reset', function () {
                    cropper.reset();
                })
                .on('click', '.scale-x', function () {
                    var $this = $(this);
                    cropper.scaleX($this.data('value'));
                    $this.data('value', -$this.data('value'));
                })
                .on('click', '.scale-y', function () {
                    var $this = $(this);
                    cropper.scaleY($this.data('value'));
                    $this.data('value', -$this.data('value'));
                });
        });
    }
});

$('#my-dropzone-container').on('click', '.js-open-cropper-modal', function (e) {
    e.preventDefault();
    var index = $(this).data('file-index');
    var file = storage[index];
    file.show_modal = true;
    myDropzone.createThumbnail(file);
});