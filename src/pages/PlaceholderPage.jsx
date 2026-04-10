import { Link } from 'react-router-dom'

function PlaceholderPage({ title, description, actions = [] }) {
    return (
        <section className="route-page">
            <h1>{title}</h1>
            <p>{description}</p>
            {actions.length > 0 ? (
                <div className="login-actions">
                    {actions.map((action) => (
                        <Link key={action.to} to={action.to} className={`action-btn ${action.ghost ? 'ghost' : ''}`}>
                            {action.label}
                        </Link>
                    ))}
                </div>
            ) : null}
        </section>
    )
}

export default PlaceholderPage
