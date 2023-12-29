import React, { useEffect, useRef, useState } from 'react'
import data from '../data'
import GameMessage from './GameMessage'

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

      Array.from({ length: config.rows }, () => addRow(ctx, canvas))

      Array.from({ length: Math.ceil(400 / config.speed) }, () =>
         tileRows.forEach((row) => row.decrement())
      )

      tileRows.forEach((row) => displayRow(ctx, row))
   }

   const addRow = (ctx, canvas) => {
      const generateBlackIndices = () =>
         Math.random() < config.probability
            ? [Math.floor(Math.random() * config.cols)]
            : Array.from({ length: config.blackTiles }, () =>
                 Math.floor(Math.random() * config.cols)
              )

      const blackIndices = generateBlackIndices()

      const grayIndices = []

      const tile_width = config.width / config.cols
      const tile_height = config.height / config.rows
      let y = config.height

      if (tileRows.length > 0) {
         const lastRow = tileRows[tileRows.length - 1]
         y = lastRow.y - lastRow.height
      }

      const row = {
         x: 0,
         y,
         width: config.width,
         height: config.height / config.rows,
         tileWidth: tile_width,
         tileHeight: tile_height,
         color: '#FFFFFF',
         black: { indices: blackIndices, color: '#000000' },
         gray: { indices: grayIndices, color: '#AAAAAA' },
         increment: function () {
            if (this.y + this.height >= config.height) {
               if (!this.isValid) {
                  stopGameLoop(canvas)
                  this.y += config.speed
                  displayWrongTile(ctx, this, this.black.indices)
                  return
               }
            }
            this.y = this.y + config.speed
         },
         decrement: function () {
            this.y = this.y - config.speed
         },
         isValid: false,
      }
      console.log(tileRows)
      tileRows.push(row)
   }

   const displayRow = (ctx, row) => {
      const { color, y, width, height, tileWidth, tileHeight, black, gray } = row
      ctx.fillStyle = color
      ctx.fillRect(0, y, width, height)

      for (let i = 0; i < config.cols; i++) {
         ctx.strokeRect(i * tileWidth, y, tileWidth, tileHeight)

         if (black.indices.includes(i)) {
            ctx.fillStyle = black.color
            ctx.fillRect(i * tileWidth, row.y, tileWidth, tileHeight)
         } else if (gray.indices.includes(i)) {
            ctx.fillStyle = gray.color
            ctx.fillRect(i * tileWidth, row.y, tileWidth, tileHeight)
         }
      }

      row.increment()
   }

   const stopGameLoop = (canvas) => {
      setIsGameStarted(false)
      setIsGameOver(true)
      canvas.removeEventListener('click', clickHandler)
   }

   const handleGameUserInput = (e) => {
      const { current: canvas } = canvasRef
      const ctx = canvas.getContext('2d')

      if (!isGameStarted) setIsGameStarted(true)

      tileRows.length < 30 ? (config.speed += 0.1) : (config.speed += 0.05)

      const tile_width = config.width / config.cols
      const tile_height = config.height / config.rows
      const x = e.clientX - canvas.offsetLeft
      const y = e.clientY - canvas.offsetTop
      const clicked_row = Math.ceil(y / tile_height) - 1
      const clicked_col = Math.ceil(x / tile_width) - 1

      for (let i = 0; i < tileRows.length; i++) {
         const row = tileRows[i]

         if (row.y < y && row.y + row.height > y) {
            if (row.black.indices.includes(clicked_col) || row.gray.indices.includes(clicked_col)) {
               if (!row.isValid) {
                  row.gray.indices.push(clicked_col)
                  row.black.indices = row.black.indices.filter((index) => index !== clicked_col)
                  setScore((prev) => prev + 1)

                  if (row.black.indices.length === 0) {
                     row.isValid = true
                     addRow(ctx, canvas)
                  }
               }
            } else {
               stopGameLoop(canvas)
               displayWrongTile(ctx, row, clicked_col)
            }
            break
         }
      }
   }

   const displayWrongTile = (ctx, row, col_number) => {
      ctx.fillStyle = '#FF0000'
      row.decrement()
      ctx.fillRect(col_number * row.tileWidth, row.y, row.tileWidth, row.tileHeight)
   }

   const restartGame = () => {
      config.speed = config.defaultSpeed
      setShowWelcomeMessage(false)
      setScore(0)
      setIsGameStarted(false)
      setIsGameOver(false)
   }

   const renderGame = () => {
      const { current: canvas } = canvasRef
      const ctx = canvas.getContext('2d')

      ctx.clearRect(0, 0, data.config.width, data.config.height)

      for (let i = 0; i < data.tileRows.length; i++) {
         displayRow(ctx, data.tileRows[i])
      }

      requestId = requestAnimationFrame(renderGame)
   }

   const clickHandler = (event) => {
      const { current: canvas } = canvasRef
      const ctx = canvas.getContext('2d')

      handleGameUserInput(event, canvas, ctx)
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
      isGameStarted && renderGame()

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
               onClick={restartGame}
            />
         )}

         {isGameOver && (
            <GameMessage
               message="Opps! Wrong Tile"
               buttonLabel="Restart Game"
               onClick={restartGame}
            />
         )}
      </>
   )
}

export default Canvas
