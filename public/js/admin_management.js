$(document).ready(function(){
    $(".button-collapse").sideNav();
    $('.modal-trigger').leanModal();
})

var user = { 
    id: undefined; 
    superUser : undefined 
};

function getUser(userID, superUser){
    user.id = userID;
    user.superUser = superUser;
}

function changePassword() {
    var oldPassword = $('[name="oldpassword"]').val();
    var newPassword = $('[name="newpassword"]').val();

    if (newPassword == "" || oldPassword == ""){
        Materialize.toast('Все поля должны быть заполнены', 4000);
        return 0;
    }

    $.ajax({
        type:"POST",
        url: '/admin/updatePassword',
        data: 'oldpass='+oldPassword+'&newpass='+newPassword+'&id='+user.id,
        success: function (data) {
            if (!data){ Materialize.toast('Неверный пароль', 4000);}
            else { window.location.replace("/admin");}
        }
    });
}

function addUser(){
    var name = $('[name="login"]').val();
    var password = $('[name="password"]').val();

    if (name == "" || password == ""){
        Materialize.toast('Все поля должны быть заполнены', 4000);
        return 0;
    }

    $.ajax({
        type:"POST",
        url: '/admin/createUser',
        data: 'login='+name+'&password='+password,
        success: function (data) {
            if (!data){ Materialize.toast('Такой пользователь уже существует', 4000);}
            else { window.location.replace("/admin");}
        }
    });
}

function deleteUser(){

     $.ajax({
         type:"DELETE",
         url:'/admin/deleteUser',
         data: "id="+user.id,
        success: function(data){
            if (data){
                $('#'+user.id+"tr").remove();
            }
        }
    });
}