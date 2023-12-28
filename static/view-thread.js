let thread_id = window.parent.selected_thread

const element_close = document.getElementById("view-thread-close")
const element_delete_thread_button = document.getElementById("delete-thread")
const element_like_thread_button = document.getElementById("like-thread")
const element_dislike_thread_button = document.getElementById("dislike-thread")
const element_get_comments = document.getElementById("get-comments")
const element_back_comment_page = document.getElementById("back-comment-page")
const element_next_comment_page = document.getElementById("next-comment-page")
const element_submit_comment_button = document.getElementById("submit-comment")

let form_comment_page = 1;
let max_comment_page = 1;

element_close.addEventListener("click", close_doc);
element_delete_thread_button.addEventListener("click", delete_thread);
element_like_thread_button.addEventListener("click", like_thread);
element_dislike_thread_button.addEventListener("click", dislike_thread);
element_get_comments.addEventListener("click", update_comment_display);
element_back_comment_page.addEventListener("click", decrement_form_comment_page);
element_next_comment_page.addEventListener("click", increment_form_comment_page);
element_submit_comment_button.addEventListener("click", submit_comment);


let thread_likes = 0


get_thread_info()
update_comment_form_max();
update_comment_display();



async function get_thread_info() {
    try {


        const promise = await fetch("./threadinfo?" + new URLSearchParams({
            'id': thread_id,
        }), { method: "GET" })

        const result = await promise.json()

        thread_likes = result["likes"]



        document.getElementById("view-thread-title").innerHTML = result["title"]
        document.getElementById("view-thread-body").innerHTML = result["body"]
        document.getElementById("thread-date").innerHTML = window.parent.date_to_readable(result["date"])
        document.getElementById("thread-last-update").innerHTML = window.parent.date_to_readable(result["lastupdate"])
        document.getElementById("thread-likes").innerHTML = thread_likes

    }
    catch {
        alert("Network error: /threadinfo failed to execute")
    }

}

async function delete_thread() {
    try {
        await fetch("./deletethread",
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
    catch {
        alert("Network error: /deletethread failed to execute")
    }

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
    try {


        await fetch("./likethread",
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
    catch {
        alert("Network error: /likethread failed to execute")
    }
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
    let data_arr = []
    for (let i in data) {
        let temp_arr = []
        for (let j in data[i]) {
            temp_arr.push(data[i][j])
        }
        data_arr.push(temp_arr);
    }

    for (let i = 0; i < 5; i++) {
        const body_element = document.getElementById(`body-comment-${i + 1}`)
        const id_element = document.getElementById(`id-comment-${i + 1}`)
        const date_element = document.getElementById(`date-comment-${i + 1}`)
        const likes_element = document.getElementById(`likes-comment-${i + 1}`)
        const div_element = document.getElementById(`image-div-${i + 1}`)
        const table_row = document.getElementById(`comment-row-${i + 1}`)

        body_element.innerHTML = data_arr[i][1]
        id_element.innerHTML = data_arr[i][0]
        date_element.innerHTML = window.parent.date_to_readable(data_arr[i][2])
        likes_element.innerHTML = data_arr[i][3]


        if (data_arr[i][5] == '_') {
            div_element.innerHTML = `<label>${data_arr[i][5]}</label>`
            div_element.style.display = "none"
        }
        else {
            div_element.style.display = "inherit"
            div_element.innerHTML = `<img src='${data_arr[i][5]}'>`

        }

        const dislike_element = document.getElementById(`dislike-comment-row${i + 1}`)
        const like_element = document.getElementById(`like-comment-row${i + 1}`)
        const delete_element = document.getElementById(`delete-comment-row${i + 1}`)

        if (data_arr[i][0] == '_') {
            dislike_element.innerHTML = ''
            like_element.innerHTML = ''
            delete_element.innerHTML = ''
            table_row.style.display = 'none'
        }
        else {
            dislike_element.innerHTML = '-'
            like_element.innerHTML = '+'
            delete_element.innerHTML = 'Delete'
            table_row.style.display = 'initial'
        }


    }
}





// // Updates which threads are currently shown to the user
async function update_comment_display() {

    const select_option = document.getElementById("sortby-comments")
    const select_value = select_option.options[select_option.selectedIndex].value;
    const search_item = document.getElementById("search-comments").value

    try {



        const promise = await fetch("./comments?" + new URLSearchParams({
            'select': select_value,
            'search': search_item,
            'page': form_comment_page,
            'thread-id': thread_id,
        }), { method: "GET" })


        const result_json = await promise.json()
        update_comment_table(result_json)
        update_comment_form_max()
    }
    catch {
        alert("Network error: /comments failed to execute")
    }
}

// // Gets the number of pages of threads in the application
async function get_comment_count() {
    try {


        const promise = await fetch("./getcommentcount?" + new URLSearchParams({
            'thread-id': thread_id,
        }), { method: "GET" })

        const json_obj = await promise.json()
        document.getElementById("max-comment-page").innerHTML = json_obj["page_count"]


    }
    catch {
        alert("Network error: /getcommentcount failed to execute")
    }
}

async function submit_comment() {

    const form = document.getElementById("submit-comment-form")
    const formData = new FormData(form);
    formData.append("thread-id", thread_id);


    document.getElementById("new-comment-box").value = ''
    document.getElementById("upload-file").value = ''

    try {


        const promise = await fetch("./addcomment",
            {
                method: "POST",
                body: formData
            })

        const json_obj = await promise.json()
        if (json_obj["error"] == "content") {
            alert("No body/image provided")
        }
        else if (json_obj["error"] == "file") {
            alert("Filetype not supported")
        }
        else if (json_obj["error"] == "length") {
            alert("Comment length not in desired range")
        }

        get_last_thread_update()
        await window.parent.update_thread_display()

        await update_comment_display()

    }
    catch {
        alert("Network error: /addcomment failed to execute")
    }

}

async function like_comment(pos, likes) {
    const comment_id = document.getElementById(`id-comment-${pos}`).innerHTML
    if (comment_id == '_') {
        return;
    }
    const like_count_element = document.getElementById(`likes-comment-${pos}`)
    const like_count = parseInt(like_count_element.innerHTML)

    await update_comment_likes(comment_id, likes)
    like_count_element.innerHTML = like_count + likes


    await update_comment_display()
}


async function delete_comment_check(pos) {
    // Makes sure an empty page isn't displayed when the first element is deleted
    if (pos == 1 && form_comment_page > 1 && document.getElementById("id-comment-2").innerHTML == '_') {
        form_comment_page = form_comment_page - 1
    }


    const comment_id = document.getElementById(`id-comment-${pos}`).innerHTML
    if (comment_id == '_') {
        return;
    }

    await delete_comment(comment_id);
    await window.parent.update_thread_display()
    await update_comment_display()

}


async function update_comment_likes(id, val) {
    try {


        await fetch("./likecomment",
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
    catch {
        alert("Network error: /likecomment failed to execute")
    }

}

async function delete_comment(comment_id) {
    try {
        await fetch("./deletecomment",
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
    catch {
        alert("Network error: /deletecomment failed to execute")
    }



}

async function get_last_thread_update() {
    try {


        const promise = await fetch("./getlastupdate?" + new URLSearchParams({
            'thread-id': thread_id,
        }), { method: "GET" })

        const json_obj = await promise.json()
        document.getElementById("thread-last-update").innerHTML = json_obj["last_update"]

    }
    catch {
        alert("Network error: /getlastupdate failed to return values")
    }
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
