var thread_id = window.parent.selected_thread

element_close = document.getElementById("close")
element_delete_thread_button = document.getElementById("delete-thread")
element_like_thread_button = document.getElementById("like-thread")
element_dislike_thread_button = document.getElementById("dislike-thread")
element_get_comments = document.getElementById("get-comments")
element_back_comment_page = document.getElementById("back-comment-page")
element_next_comment_page = document.getElementById("next-comment-page")
element_submit_comment_button = document.getElementById("submit-comment")

var form_comment_page = 1;
var max_comment_page = 1;

element_close.addEventListener("click", close_doc);
element_delete_thread_button.addEventListener("click", delete_thread);
element_like_thread_button.addEventListener("click", like_thread);
element_dislike_thread_button.addEventListener("click", dislike_thread);
element_get_comments.addEventListener("click", update_comment_display);
element_back_comment_page.addEventListener("click", decrement_form_comment_page);
element_next_comment_page.addEventListener("click", increment_form_comment_page);
element_submit_comment_button.addEventListener("click", submit_comment);


var thread_likes = 0


document.getElementById("thread-num").innerHTML = thread_id

get_thread_info()
update_comment_form_max();
update_comment_display();



async function get_thread_info() {
    var promise = await fetch("./threadinfo?" + new URLSearchParams({
        'id': thread_id,
    }), { method: "GET" })

    var result = await promise.json()

    thread_likes = result["likes"]

    document.getElementById("thread-title").innerHTML = result["title"]
    document.getElementById("thread-body").innerHTML = result["body"]
    document.getElementById("thread-date").innerHTML = result["date"]
    document.getElementById("thread-last-update").innerHTML = result["lastupdate"]
    document.getElementById("thread-likes").innerHTML = thread_likes
    document.getElementById("thread-comments").innerHTML = result["comments"]

}

async function delete_thread() {
    promise = await fetch("./deletethread",
        {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                "thread-id": thread_id,
            })
        })

    await window.parent.update_thread_display()
    close_doc();

}

async function like_thread() {
    update_thread_likes(1);
    thread_likes = thread_likes + 1;
    document.getElementById("thread-likes").innerHTML = thread_likes
}

async function dislike_thread() {
    update_thread_likes(-1);
    thread_likes = thread_likes - 1;
    document.getElementById("thread-likes").innerHTML = thread_likes
}

async function update_thread_likes(val) {
    promise = await fetch("./likethread",
        {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                "thread-id": thread_id,
                "like-number": val,
            })
        })

    window.parent.update_thread_display()

}

// // Increments the thread page we are currently on, and modifies the form_page attribute
function increment_form_comment_page() {
    if (form_comment_page + 1 <= max_comment_page) {
        form_comment_page = form_comment_page + 1;
    }
    update_comment_display()
}

// // Increments the thread page we are currently on, and modifies the form_page attribute
function decrement_form_comment_page() {
    if (form_comment_page - 1 >= 1) {
        form_comment_page = form_comment_page - 1;
    }
    update_comment_display()
}

// // Updates the page numbers for the thread page
function update_comment_form_max() {
    document.getElementById("form-comment-page").innerHTML = form_comment_page;
    get_comment_count();
    max_comment_page = document.getElementById("max-comment-page").innerHTML
}

// // Updates the table with data given
function update_comment_table(data) {
    var data_arr = []
    for (var i in data) {
        var temp_arr = []
        for (var j in data[i]) {
            temp_arr.push(data[i][j])
        }
        data_arr.push(temp_arr);
    }

    for (let i = 0; i < 5; i++) {
        body_element = document.getElementById(`body-comment-${i + 1}`)
        id_element = document.getElementById(`id-comment-${i + 1}`)
        date_element = document.getElementById(`date-comment-${i + 1}`)
        likes_element = document.getElementById(`likes-comment-${i + 1}`)
        div_element = document.getElementById(`image-div-${i + 1}`)

        body_element.innerHTML = data_arr[i][1]
        id_element.innerHTML = data_arr[i][0]
        date_element.innerHTML = data_arr[i][2]
        likes_element.innerHTML = data_arr[i][3]

        
        if (data_arr[i][5] == '_') {
            div_element.innerHTML = `<label>${data_arr[i][5]}</label>`
        }
        else {
            div_element.innerHTML = `<img src='${data_arr[i][5]}'>`
        }

        dislike_element = document.getElementById(`dislike-comment-row${i + 1}`)
        like_element = document.getElementById(`like-comment-row${i + 1}`)
        delete_element = document.getElementById(`delete-comment-row${i + 1}`)

        if (data_arr[i][0] == '_') {
            dislike_element.innerHTML = ''
            like_element.innerHTML = ''
            delete_element.innerHTML = ''
        }
        else {
            dislike_element.innerHTML = '-'
            like_element.innerHTML = '+'
            delete_element.innerHTML = 'X'

        }


    }
}

// // Updates which threads are currently shown to the user
async function update_comment_display() {

    var select_option = document.getElementById("sortby-comments")
    var select_value = select_option.options[select_option.selectedIndex].value;
    var search_item = document.getElementById("search-comments").value


    var promise = await fetch("./comments?" + new URLSearchParams({
        'select': select_value,
        'search': search_item,
        'page': form_comment_page,
        'thread-id': thread_id,
    }), { method: "GET" })


    result_json = await promise.json()
    update_comment_table(result_json)
    update_comment_form_max()
}

// // Gets the number of pages of threads in the application
async function get_comment_count() {

    var promise = await fetch("./getcommentcount?" + new URLSearchParams({
        'thread-id': thread_id,
    }), { method: "GET" })

    json_obj = await promise.json()
    document.getElementById("thread-comments").innerHTML = json_obj["comment_count"]
    document.getElementById("max-comment-page").innerHTML = json_obj["page_count"]
}

async function submit_comment() {

    const form = document.getElementById("submit-comment-form")
    const formData = new FormData(form);
    formData.append("thread-id",thread_id);


    document.getElementById("new-comment-box").value = ''
    document.getElementById("upload-file").value = ''


    promise = await fetch("./addcomment",
        {
            method: "POST",
            body: formData
        })

    json_obj = await promise.json()
    if (json_obj["error"] == "content") {
        alert("No body/image provided")
    }
    else if (json_obj["error"] == "file") {
        alert("Filetype not supported")
    }

    get_last_thread_update()
    await window.parent.update_thread_display()

    await update_comment_display()

}

async function like_comment(pos, likes) {
    comment_id = document.getElementById(`id-comment-${pos}`).innerHTML
    if (comment_id == '_') {
        return;
    }
    like_count_element = document.getElementById(`likes-comment-${pos}`)
    like_count = parseInt(like_count_element.innerHTML)

    await update_comment_likes(comment_id, likes)
    like_count_element.innerHTML = like_count + likes


    await update_comment_display()
}


async function delete_comment_check(pos) {
    // Makes sure an empty page isn't displayed when the first element is deleted
    if (pos == 1 && form_comment_page > 1 && document.getElementById("id-comment-2").innerHTML == '_') {
        form_comment_page = form_comment_page - 1
    }


    comment_id = document.getElementById(`id-comment-${pos}`).innerHTML
    if (comment_id == '_') {
        return;
    }

    await delete_comment(comment_id);
    await window.parent.update_thread_display()
    await update_comment_display()

}


async function update_comment_likes(id, val) {
    promise = await fetch("./likecomment",
        {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                "comment-id": id,
                "like-number": val,
            })
        })

}

async function delete_comment(comment_id) {
    promise = await fetch("./deletecomment",
        {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                "comment-id": comment_id,
            })
        })



}

async function get_last_thread_update() {
    var promise = await fetch("./getlastupdate?" + new URLSearchParams({
        'thread-id': thread_id,
    }), { method: "GET" })

    json_obj = await promise.json()
    document.getElementById("thread-last-update").innerHTML = json_obj["last_update"]
}


function close_doc() {
    element_close.removeEventListener("click", close_doc, true);
    element_delete_thread_button.removeEventListener("click", delete_thread, true);
    element_like_thread_button.removeEventListener("click", like_thread, true);
    element_dislike_thread_button.removeEventListener("click", dislike_thread, true);
    element_get_comments.removeEventListener("click", update_comment_display, true);
    element_back_comment_page.removeEventListener("click", decrement_form_comment_page, true);
    element_next_comment_page.removeEventListener("click", increment_form_comment_page, true);
    element_submit_comment_button.removeEventListener("click", submit_comment, true);


    window.parent.close_frame()
}
