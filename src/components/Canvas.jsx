import React, { useEffect, useRef, useState } from 'react'
import data from '../data/data'
import GameMessage from './GameMessage'
import { addRow, displayRow, restartGame, handleGameUserInput } from '../utils/GameLogic'

const Canvas = () => {
   const [score, setScore] = useState(0)
   const [showWelcomeMessage, setShowWelcomeMessage] = useState(true)
   const [isGameOver, setIsGameOver] = useState(false)
   const [isGameStarted, setIsGameStarted] = useState(false)

   const canvasRef = useRef(null)
   const { config, tileRows } = data
   let requestId

   const initGame = () => {
      const { current: canvas } = canvasRef
      const ctx = canvas.getContext('2d')

      ctx.clearRect(0, 0, config.width, config.height)
      tileRows.length = 0

      Array.from({ length: config.rows }, () => addRow(canvas, stopGameLoop))

      Array.from({ length: Math.ceil(400 / config.speed) }, () =>
         tileRows.forEach((row) => row.decrement())
      )

      tileRows.forEach((row) => displayRow(ctx, row))
   }

   const stopGameLoop = (canvas) => {
      setIsGameStarted(false)
      setIsGameOver(true)
      canvas.removeEventListener('click', clickHandler)
   }

   const renderGame = () => {
      const { current: canvas } = canvasRef
      const ctx = canvas.getContext('2d')

      ctx.clearRect(0, 0, config.width, config.height)

      for (let i = 0; i < tileRows.length; i++) {
         displayRow(ctx, tileRows[i])
      }

      requestId = requestAnimationFrame(renderGame)
   }

   const clickHandler = (event) => {
      const { current: canvas } = canvasRef

      handleGameUserInput(event, canvas, setScore, isGameStarted, setIsGameStarted, stopGameLoop)
   }

   const setupGameEventListeners = () => {
      const { current: canvas } = canvasRef
      if (!(showWelcomeMessage || isGameOver)) {
         canvas.addEventListener('click', clickHandler)
      }
   }

   useEffect(() => {
      const { current: canvas } = canvasRef
      const ctx = canvas.getContext('2d')

      ctx.lineWidth = 1
      ctx.strokeStyle = '#116D6E'

      !isGameOver && initGame()
   }, [isGameOver])

   useEffect(() => {
      setupGameEventListeners()
      isGameStarted && renderGame(canvasRef, requestId)

      return () => {
         const { current: canvas } = canvasRef
         canvas.removeEventListener('click', clickHandler)
         cancelAnimationFrame(requestId)
      }
   }, [showWelcomeMessage, isGameStarted, isGameOver])

   return (
      <>
         <div className="absolute font-bold text-2xl left-1/2 transform -translate-x-1/2 top-3 text-white bg-slate-600 px-2 min-w-9 rounded m-auto">
            {score}
         </div>
         <canvas
            id="gameCanvas"
            className="border-[0.5px] border-gray-300"
            ref={canvasRef}
            width={data.config.width}
            height={data.config.height}
         ></canvas>

         {(showWelcomeMessage || isGameOver) && (
            <h1 className="sm:text-4xl text-3xl block [text-shadow:_-1px_-1px_0_#fff] absolute top-1/4 transform -translate-y-1/2 left-0 w-full">
               Piano Tiles Game
            </h1>
         )}

         {showWelcomeMessage && (
            <GameMessage
               message="Let's Start Tapping"
               buttonLabel="Start Playing"
               onClick={() =>
                  restartGame(setShowWelcomeMessage, setScore, setIsGameStarted, setIsGameOver)
               }
            />
         )}

         {isGameOver && (
            <GameMessage
               message="Opps! Wrong Tile"
               buttonLabel="Restart Game"
               onClick={() =>
                  restartGame(setShowWelcomeMessage, setScore, setIsGameStarted, setIsGameOver)
               }
            />
         )}
      </>
   )
}

export default Canvas
