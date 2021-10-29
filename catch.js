var Bodies = Matter.Bodies
var Body = Matter.Body
var Composite = Matter.Composite
var Engine = Matter.Engine
var Events = Matter.Events
var MouseConstraint = Matter.MouseConstraint
var Mouse = Matter.Mouse
var Query = Matter.Query
var Render = Matter.Render
var World = Matter.World

// create an engine
var engine = Engine.create()

const print = console.log

// create a renderer
var render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false
  }
})

const browser = true
const round_duration = 120

// create two boxes and a ground
const boxes = []
for (let i = 0; i < 50; i++) {
  isStatic = Math.random() < 0.4
  const box = Bodies.rectangle(
    50 + Math.round(Math.random() * 700),
    400,
    3 + Math.round(Math.random() * 150),
    3 + Math.round(Math.random() * 40),
    //{ frictionAir: 0.1 }
    { 
      isStatic,
      render: { 
        fillStyle: isStatic ? '#292D42' : '#44475A',
        lineWidth: 0,
      }
    }
  )
  Body.setAngle(box, Math.random() * Math.PI)
  boxes.push(box)
}

var ball = Bodies.circle(
  400, 50, 15,
  {
    render: {
      sprite: {
        texture: 'agent_a.png',
        xScale: 0.2,
        yScale: 0.2
      },
      fillStyle: "#C72321"
    }
  }
);
Body.setDensity(ball, 0.004)

var goal = Bodies.circle(
  200, 50, 10,
  {
    render: {
      sprite: {
        texture: 'agent_b.png',
        xScale: 0.2,
        yScale: 0.2
      },
      fillStyle: "#00CC69"
    }
  }
);
Body.setDensity(goal, 0.004)
// var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
var ceil = Bodies.rectangle(400, -10, 810, 60, { isStatic: true });
var wall_a = Bodies.rectangle(-10, 300, 60, 600, { isStatic: true });
var wall_b = Bodies.rectangle(810, 300, 60, 600, { isStatic: true });
var bodies = [ground, ceil, wall_a, wall_b].concat(boxes)

// add all of the bodies to the world
// World.add(engine.world, [boxA, boxB, ball, ground])
World.add(engine.world, [ground, ceil, wall_a, wall_b, ball, goal])
World.add(engine.world, boxes)

function state (target=ball) {
  const ball_state = [
    ball.position.x,
    ball.position.y,
    ball.velocity.x,
    ball.velocity.y
  ]
  const goal_state = [
    goal.position.x,
    goal.position.y,
    goal.velocity.x,
    goal.velocity.y
  ]
  return goal_state.concat(ball_state).concat(target.depths).concat([reward()])
}

function reward () {
  return -Math.sqrt(
    Math.pow(ball.position.x - goal.position.x, 2) + Math.pow(ball.position.y - goal.position.y, 2)
  ) / 100
}

function reset () {
  Body.setPosition(ball, {
    x: 50 + Math.round(Math.random() * 700),
    y: 50 + Math.round(Math.random() * 400)
  })
  Body.setPosition(goal, {
    x: 50 + Math.round(Math.random() * 700),
    y: 50 + Math.round(Math.random() * 400)
  })
  boxes.forEach(box => {
    Body.setPosition(box, {
      x: 10 + Math.round(Math.random() * 780),
      y: 50 + Math.round(Math.random() * 500)
    })
    Body.setAngle(box, Math.random() * Math.PI)
  })
}

reset()

// run the engine
Engine.run(engine)

// run the renderer
Render.run(render)

// add mouse control
var mouse = Mouse.create(render.canvas)
var mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    angularStiffness: 0,
    render: {
      visible: false
    }
  }
})

Composite.add(engine.world, mouseConstraint)
render.mouse = mouse

function get_depths (target) {
  var context = render.context
  var startPoint = { x: target.position.x, y: target.position.y }
  var d = 200
  var depths = []
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 10) {
    var md = d
    context.strokeStyle = '#222';
    for (let d_test = 20; d_test < d; d_test += 20) {
      var endPoint = { x: target.position.x + d_test * Math.cos(angle), y: target.position.y - d_test * Math.sin(angle)}
      var collisions = Query.ray(bodies, startPoint, endPoint)
      if (collisions.length > 0) {
        context.strokeStyle = '#666';
        md = d_test
        break
      }
    }

    var surfacePoint = { x: startPoint.x + 15 * Math.cos(angle), y: startPoint.y - 15 * Math.sin(angle)}
    var collisionPoint = { x: startPoint.x + md * Math.cos(angle), y: startPoint.y - md * Math.sin(angle)}
    context.beginPath();
    context.moveTo(surfacePoint.x, surfacePoint.y);
    context.lineTo(collisionPoint.x, collisionPoint.y);
    context.lineWidth = 0.5
    context.stroke()

    // context.font = "10px Arial"
    // context.fillStyle = "white"
    // context.fillText("x x", startPoint.x - 6, startPoint.y + 3)

    depths.push((d - md) / d)
  }
  // console.log(depths)
  return depths
}

Events.on(render, 'afterRender', function () {
  const context = render.context
  context.font = '17px mono';
  context.textAlign = 'center'
  context.fillStyle = 'white'
  context.fillText(score_a + ':' + score_b, 400, 50, 100)

  context.font = '10px mono';
  context.fillStyle = (round_duration - steps <= 20) ? '#53d012' : '#56596C'
  context.fillText((round_duration - steps) + '', 400, 70, 100)

  context.beginPath();
  context.arc(350, 43, 1, 0, 2 * Math.PI, false)
  context.fillStyle = '#d00569'
  context.fill()

  context.beginPath();
  context.arc(450, 43, 1, 0, 2 * Math.PI, false)
  context.fillStyle = '#53d012'
  context.fill()

  ball.depths = get_depths(ball)
  // Body.setAngle(ball, 0)
  goal.depths = get_depths(goal)
  // Body.setAngle(goal, 0)
})

function move_down (target=ball) {
  Body.setVelocity(target, {x: target.velocity.x, y: target.velocity.y + 10})
}
function move_up (target=ball) {
  // if (Math.abs(target.velocity.y) < 0.3) {
  if (Math.max(...target.depths.slice(14, 17)) >= 0.9) {
    Body.setVelocity(target, {x: target.velocity.x, y: target.velocity.y - 10})
  } else if (Math.max(...target.depths.slice(10, 14)) >= 0.9) {
    Body.setVelocity(target, {x: target.velocity.x + 3, y: target.velocity.y - 6})
  } else if (Math.max(...target.depths.slice(16)) >= 0.9) {
    Body.setVelocity(target, {x: target.velocity.x - 3, y: target.velocity.y - 6})
  }
}
function move_left (target=ball) {
  Body.setVelocity(target, {x: target.velocity.x - 2.2, y: target.velocity.y - 2})
}
function move_right (target=ball) {
  Body.setVelocity(target, {x: target.velocity.x + 2.2, y: target.velocity.y - 2})
}

document.onkeydown = function checkKey(e) {
  e = e || window.event;
  if (e.keyCode == '38') {
    move_up(goal)
  }
  else if (e.keyCode == '40') {
    move_down(goal)
  }
  else if (e.keyCode == '37') {
    move_left(goal)
  }
  else if (e.keyCode == '39') {
    move_right(goal)
  }
}

var state_a_hist = []
var state_b_hist = []

function argmax (array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1]
}

function apply_action (target, action_id) {
  if (action_id === 0) {
    move_left(target)
  } else if (action_id === 1) {
    move_right(target)
  } else {
    move_up(target)
  }
}


let steps = 0
let score_a = 0
let score_b = 0

async function run () {
  await tf.setBackend('wasm')
  const model_a = await tf.loadLayersModel('dqn_ray_A_weights_hist_js/model.json')
  const model_b = await tf.loadLayersModel('dqn_ray_B_weights_hist_js/model.json')

  setInterval(() => {
    const state_a = state(ball)
    const state_b = state(goal)

    if (state_a_hist.length === 0) {
      state_a_hist = Array(20).fill(state_a)
      state_b_hist = Array(20).fill(state_b)
    } else {
      state_a_hist.push(state_a)
      state_a_hist = state_a_hist.slice(1)
      state_b_hist.push(state_b)
      state_b_hist = state_b_hist.slice(1)
    }

    const action_a = model_a.predict(tf.tensor([state_a_hist])).arraySync()[0]
    const action_a_id = Math.random() < 0.1 ? Math.round(Math.random() * 3) : argmax(action_a)
    apply_action(ball, action_a_id)

    const action_b = model_b.predict(tf.tensor([state_b_hist])).arraySync()[0]
    const action_b_id = Math.random() < 0.1 ? Math.round(Math.random() * 3) : argmax(action_b)
    apply_action(goal, action_b_id)

    // console.log(action_a.arraySync(), action_b.arraySync())
    steps += 1

    const touch = reward() > -0.33
    const round_end = steps >= round_duration

    if (touch) {
      score_a++
    }

    if (round_end) {
      score_b++
    }

    if (round_end || touch) {
      steps = 0
      state_a_hist = []
      state_b_hist = []
      reset()
    }

  }, 280)
}

if (browser) {
  run()
}
