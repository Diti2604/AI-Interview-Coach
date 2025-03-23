import "../../styles/ui/Button.css"

function Button({ children, className = "", disabled = false, ...props }) {
  return (
    <button className={`button ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

export default Button

