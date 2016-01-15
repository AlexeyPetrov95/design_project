
$(document).ready(function(){
    $('ul.tabs').tabs();
    $('.modal-trigger').leanModal();
    $('select').material_select();
});

// Залить фотографии с аплоадера
function uploadPhoto(projectId){
    var files = document.getElementById("photo_chooser").files;
    if (!files) { Materialize.toast('No files', 4000); return; }
    else
    {
        var data = [];
        for (var i = 0; i < files.length; i++){

            data[i] = new FormData();
            data[i].append('uploadFile', files[i]);

        }
        var upload = function(index){

            if (index < data.length){
                $.ajax({
                    type: "POST",
                    url: "/admin/projects/uploadPhoto/" + projectId,
                    data: data[index],
                    cache: false,
                    processData: false,
                    contentType: false,
                    beforeSend: function(){

                        $('#preloader').css("display", "block");
                    },
                    success: function(res){

                        // Несмотря на успех аплода текущей фотки,
                        // пытаемся залить следующую фотографию
                        // до тех пор, пока (index < data.length)
                        upload(++index);

                        // если залитый файл не проходит ограничения
                        if (res.status == 'bad') {

                            // то сообщаем об этом пользователю
                            Materialize.toast("Ошибка при загрузке", 3000); 

                        } else {

                            // иначе генерим HTML для нового блока фотографии
                            var photoCardHTML = "";
                            photoCardHTML += 
                                '<div class="card" id="main_photo">' +
                                    '<div class="card-image">' +
                                        '<img style="height: 100%" src="/images/uploaded_files/'+res.mini_name + '"/>' +
                                    '</div>' +
                                    '<ul class="card-action-buttons">' +
                                        '<li>' + 
                                            '<a onclick="deletePhoto(' + res.photo_id + ');" class="btn-floating waves-effect waves-light red">' + 
                                                '<i class="material-icons">close</i>' + 
                                            '</a>' + 
                                        '</li>' +
                                    '</ul>' +
                                    '<div class="card-content overflow-none">' +
                                        '<div class="input-field">' +
                                            '<div>' +
                                                '<select class="browser-default custom-select" onChange="update('+res.photo_id +')" id="image_type' + res.photo_id + '">';

                            for (var j = 0; j < res.image_types.length; j++) {
                                photoCardHTML += '<option value="' + res.image_types[j].type + '">' + res.image_types[j].type_name + '</option>';                    
                            }

                            photoCardHTML +=    '</select>' + 
                                            '</div>' +
                                        '</div>' +
                                    '</div>' + 
                                '</div>';

                            // Создаем сам блок для фотографии
                            var photoCard = document.createElement("div");
                            photoCard.className = "col s12 m6 l4";
                            photoCard.setAttribute("id", res.photo_id+"photo");
                            // и пихаем в него собранный HTML
                            photoCard.innerHTML = photoCardHTML;
                            document.getElementById("main_photo").appendChild(photoCard);
                        }
                    }
                });

            } else {

                // добавляем materialize обработку на селекты
                $('select').material_select();
                $('#preloader').css("display", "none");
                Materialize.toast("фотографии загружены на сервер", 1000);
            }
        }
        // Запуск аплода всех фотографий, начиная с первой
        upload(0);
    };
}

// Удалить фотографию
function deletePhoto(photoId){
    $.ajax({
        type: "POST",
        url: '/admin/projects/deletePhoto/',
        data: 'id='+ photoId,
        success: function (success) {
            if (!success) {

                Materialize.toast('Не удалось удалить фото', 1000);

            } else {

                $('#' + photoId + 'photo').remove();
                Materialize.toast('Фотография удалена', 1000);
            }
        }
    });
}

// Изменить информацию о проекте
function replaceProject(id) {
    var material = $("#material").val();
    var description = $("#desc").val();
    var name = $('[name="name"]').val();
    var mark = $('[name="mark"]').val();
    var price = $('[name="price"]').val();
    var space = $('[name="space"]').val();
    var roomCount = $('[name="number_room"]').val();

    $.ajax({
        type: "POST",
        url: '/admin/projects/replaceProject',
        data: 'id='+ id + '&name=' + name + '&mark=' + mark + '&price=' + price + '&space=' + space + '&rooms=' + roomCount + '&material=' + material + '&description=' + description,
        success: function (data) {

            if (!data) {

                Materialize.toast('Не удалось сохранить изменения', 1000);

            } else {

                Materialize.toast('Изменения сохранены', 1000);
            }
        }
    });
}

// Апдейт фотографии
function update(id) {
    // id нового выбранного типа (0 = дефолт (не укзаано), 1 = главная, 2..inf = остальные)
    var type = $("#image_type"+id).val();
    var selects = $('select');
    // ajax - апдейт фотки в бд
    var update_type = function(id, type){
        $.ajax({
            type: "POST",
            url: '/admin/projects/updatePhoto',
            data: 'id='+id+'&type='+type,
        });
    };
    // если уже было выбрано главное фото, то
    if (type == "main"){
        var elem, elem_id;
        for (var i = 1; i < selects.length; i++) {
            elem = selects[i];
            console.log(elem);
            elem_id = selects[i].getAttribute('id');
            // ищем прошлые главные фото
            if (elem.value == "main"){
                // меняем их на дефолтные в селектах
                $("#"+elem_id).val('default');
                // и в бд
                update_type(elem_id.slice(10), "default");
            }
            $("#image_type"+id).val('main');
        };
    }
    // установка нового типа для выбранного фото
    update_type(id, type);
    Materialize.toast('Тип успешно изменен.', 1000);
}