# Pong, but better.

This project is a way for me to learn about the various components of software engineering, from rendering to networking. I want to use a modern tech that both allows for a wide range of possibilities and for learning experiences at every curve.

The core of the project is simple: making Pong. Through removing potential abstractions I could use, such as a game engine or a geometry renderer, I will maximize the amount of experience I get from this project.

## Running

You can try it out [here](https://pongbutbetter.com).

### Project Structure

The project is structured in a manner in which the Rust component is compiled into a Node.js package using wasm-build, then read by the web component built with Bun. The Node.js package directory is the root directory, where the source code will be listed in `/src`. The root directory of the website using Bun is in `/www`. 

### Build & Run Instructions

To build the Node.js package, first ensure you are in the root directory. Grab the cargo dependencies using `cargo c`, then use the script `/wasm-build.sh` for Linux systems. 

To build and run the website, navigate to the `www` directory (`cd www`), then execute `bun install`. This installs more dependencies. Run the project by executing `bun dev`. 
