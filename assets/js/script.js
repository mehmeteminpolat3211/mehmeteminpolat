
const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
        navigation.classList.toggle("show");
    });
}

const year = document.getElementById("year");

if (year) {
    year.textContent = new Date().getFullYear();
}

const contactForm = document.getElementById("contactForm");

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const status = document.getElementById("formStatus");
        const button = contactForm.querySelector("button[type='submit']");

        button.disabled = true;
        button.textContent = "Gönderiliyor...";
        status.textContent = "";

        const formData = new FormData(contactForm);

        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            message: formData.get("message"),
            website: formData.get("website")
        };

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gönderim başarısız.");
            }

            status.style.color = "#36d99b";
            status.textContent = result.message;
            contactForm.reset();

        } catch (error) {
            status.style.color = "#ff6464";
            status.textContent = error.message;

        } finally {
            button.disabled = false;
            button.textContent = "Mesajı Gönder";
        }
    });
}
