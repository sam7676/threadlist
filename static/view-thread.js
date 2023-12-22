var thread_id = window.parent.selected_thread
close_element = document.getElementById("close")
close_element.addEventListener("click", close_doc);

var thread_title = ''
var thread_body = ''
var thread_date = ''
var thread_likes = 0
var thread_comments = 0


document.getElementById("thread-num").innerHTML = thread_id

get_thread_info()


async function get_thread_info() {
    var promise = await fetch("./threadinfo?" + new URLSearchParams({
        'id': thread_id,
    }), { method: "GET" })

    var result = await promise.json()
    thread_title = result["title"]
    thread_body = result["body"]
    thread_date = result["date"]
    thread_likes = result["likes"]
    thread_comments = result["comments"]

    document.getElementById("thread-title").innerHTML = thread_title
    document.getElementById("thread-body").innerHTML = thread_body
    document.getElementById("thread-date").innerHTML = thread_date
    document.getElementById("thread-likes").innerHTML = thread_likes
    document.getElementById("thread-comments").innerHTML = thread_comments

}


function close_doc() {
    
    close_element.removeEventListener("click", close_doc, true);
    window.parent.close_frame()
}
