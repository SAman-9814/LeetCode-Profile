document.addEventListener("DOMContentLoaded", function () {

    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.querySelector(".stats-cards");

    // return true or false based on a regex
    function validateUsername(username) {
        if (username.trim() === "") {
            alert("Username should not be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        const isMatching = regex.test(username);
        if (!isMatching) {
            alert("Invalid Username");
        }
        return isMatching;
    }

    async function fetchUserDetails(username) {
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;

            const graphql = JSON.stringify({
                query: `
                    query userSessionProgress($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                                totalSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                    }
                `,
                variables: { username }
            });

            // ✅ Uses corsproxy for localhost, Vercel function in production
            const isLocal = window.location.hostname === '127.0.0.1'
                         || window.location.hostname === 'localhost';
            const apiUrl = isLocal
                ? 'https://corsproxy.io/?https://leetcode.com/graphql/'
                : '/api/leetcode';

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: graphql,
            });

            if (!response.ok) {
                throw new Error("Unable to fetch the User details");
            }

            const parsedData = await response.json();
            console.log("Logging data: ", parsedData);

            if (!parsedData.data || !parsedData.data.matchedUser) {
                throw new Error("User not found. Check the username.");
            }

            displayUserData(parsedData);

        } catch (error) {
            statsContainer.innerHTML = `<p>${error.message}</p>`;
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }

    function updateProgress(solved, total, label, circle) {
        const progressDegree = (solved / total) * 100;
        circle.style.setProperty("--progress-degree", `${progressDegree}%`);
        label.textContent = `${solved}/${total}`;
    }

    function displayUserData(parsedData) {
        const totalEasyQues   = parsedData.data.allQuestionsCount[1].count;
        const totalMediumQues = parsedData.data.allQuestionsCount[2].count;
        const totalHardQues   = parsedData.data.allQuestionsCount[3].count;

        const acSubmissions    = parsedData.data.matchedUser.submitStats.acSubmissionNum;
        const totalSubmissions = parsedData.data.matchedUser.submitStats.totalSubmissionNum;

        updateProgress(acSubmissions[1].count, totalEasyQues,   easyLabel,   easyProgressCircle);
        updateProgress(acSubmissions[2].count, totalMediumQues, mediumLabel, mediumProgressCircle);
        updateProgress(acSubmissions[3].count, totalHardQues,   hardLabel,   hardProgressCircle);

        const cardsData = [
            { label: "Overall Submissions",        value: totalSubmissions[0].submissions },
            { label: "Overall Easy Submissions",   value: totalSubmissions[1].submissions },
            { label: "Overall Medium Submissions", value: totalSubmissions[2].submissions },
            { label: "Overall Hard Submissions",   value: totalSubmissions[3].submissions },
        ];

        console.log("card ka data: ", cardsData);

        cardStatsContainer.innerHTML = cardsData.map(data =>
            `<div class="card">
                <h4>${data.label}</h4>
                <p>${data.value}</p>
            </div>`
        ).join("");
    }

    searchButton.addEventListener('click', function () {
        const username = usernameInput.value;
        console.log("logging username: ", username);
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });

});