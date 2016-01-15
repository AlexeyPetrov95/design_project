    var checkedCount = 0;
    var checkedLimit = 6;
    
    $(document).ready(function(){
        $(".button-collapse").sideNav();
        $('.modal-trigger').leanModal();
        checkedCount = document.getElementById("selected").children.length;
    });
    
    var trycheck = function(id, name, mark, checked){
        
        if (checked && checkedCount >= checkedLimit) {
            
            Materialize.toast("Больше 6 проектов нельзя", 1000);
            return;
        } 
        
        // удаляем старую строку
        var sel_tr = document.getElementById(id+"tr");
        sel_tr.parentNode.removeChild(sel_tr);
        // создаем новую
        var action_i = document.createElement("i");
        action_i.className = "small material-icons";
        action_i.innerHTML = checked ? "not_interested" : "play_arrow";
        var action_a = document.createElement("a");
        action_a.className = "btn-flat";
        action_a.setAttribute("onclick", "trycheck("+id+", '"+name+"', '"+mark+"', " + !checked + ");");
        action_a.appendChild(action_i);
        var action_td = document.createElement("td");
        action_td.appendChild(action_a);
        var name_td = document.createElement("td");
        name_td.innerHTML = name;
        var mark_td = document.createElement("td");
        mark_td.innerHTML = mark;
        var new_tr = document.createElement("tr");
        new_tr.appendChild(name_td);
        new_tr.appendChild(mark_td);
        new_tr.appendChild(action_td);            
        new_tr.setAttribute("id", id+"tr");

        // добавляем новую
        var parent = document.getElementById(checked ? "selected" : "unselected");
        parent.insertBefore(new_tr, parent.firstChild);

        if (checked) checkedCount++; else checkedCount--;

        $.ajax({
            type:"POST",
            url:'/admin/viewList/changeSelection',
            data: "id="+id + '&selected=' + checked,
            success: function(data){
                if (data){
                    Materialize.toast('Главная страница обновлена', 1000);
                }
            }
        });
    };