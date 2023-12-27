const submit_thread_element = document.getElementById("new-thread-submit")
const close_element = document.getElementById("new-thread-close")

// Button listeners
submit_thread_element.addEventListener("click", submit_thread);
close_element.addEventListener("click", close_doc);

// POST request to send a new thread to the server
async function submit_thread() {
    const title_box = document.getElementById("new-thread-title-box")
    const body_box = document.getElementById("new-thread-body-box")

    const thread_title = title_box.value
    const thread_body = body_box.value

    

    try {


        const promise = await fetch("./createnewthread",
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify({
                    "title": thread_title,
                    "body": thread_body
                })
            })
        const json_obj = await promise.json()

        if (json_obj["error"] == "length") {
            alert("Thread title/body length not in range")
        }
        else {
            title_box.value = ''
            body_box.value = ''
            const new_thread_id = json_obj["thread-id"]
            await window.parent.update_thread_display()
            post_success(new_thread_id)
        }
    }
    catch {
        alert("Network error: /createnewthread failed to execute")
    }

   

}

function post_success(thread_id) {
    window.parent.selected_thread = thread_id;
    submit_thread_element.removeEventListener("click", submit_thread, true); // Succeeds
    close_element.removeEventListener("click", close_doc, true);
    window.parent.view_thread();
}

// Closes the iFrame
function close_doc() {

    submit_thread_element.removeEventListener("click", submit_thread, true); // Succeeds
    close_element.removeEventListener("click", close_doc, true);
    window.parent.close_frame()
}
