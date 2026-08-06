

async function testRegister() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "eliraz.guy@gmail.com",
        password: "Guy010704",
        name: "גיא אלירז"
      })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

testRegister();
