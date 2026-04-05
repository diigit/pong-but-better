export const MovingBackground = () => {
	return <>
		<div className="fixed bg-repeat bg-[url('../img/bg-shapes-1024.webp')] -z-10 inset-0 animate-moving-bg-fast opacity-20"/>
		<div className="fixed bg-repeat bg-[url('../img/bg-shapes-512.webp')] -z-11 inset-0 animate-moving-bg-slow opacity-15"/>
	</>
}

export default MovingBackground;