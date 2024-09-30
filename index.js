const mongoose = require('mongoose');
const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');

// MongoDB connection string
const uri = 'mongodb+srv://14cn041:Bunny%4012345@cluster0.h1axn.mongodb.net/database?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(uri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define the Movie schema
const movieSchema = new mongoose.Schema({
    id: { type: String, required: true },                // Assuming id is a string
    title: { type: String, required: true },
    description: { type: String },
    release_year: { type: Number },
    runtime: { type: Number },                            // Add runtime
    genres: [{ type: String }],
    imdb_score: { type: Number },
    age_certification: { type: String },                  // Add age_certification
    production_countries: [{ type: String }],             // Add production_countries
    type: { type: String }                                 // Add type
});

// Create a Mongoose model for the movies
const Movie = mongoose.model('Movie', movieSchema, 'netflixes');

// Define your GraphQL schema
const typeDefs = gql`
    type Movie {
        id: ID!
        title: String
        description: String
        release_year: Int
        runtime: Int
        genres: [String]
        imdb_score: Float
        age_certification: String
        production_countries: [String]
        type: String
    }

    type Query {
        movies(title: String, genre: String, page: Int, limit: Int): [Movie]
        movieByTitle(title: String!): Movie
    }

    type Mutation {
        addMovie(
            id: String!,
            title: String!, 
            description: String, 
            release_year: Int, 
            runtime: Int, 
            genres: [String], 
            imdb_score: Float, 
            age_certification: String, 
            production_countries: [String], 
            type: String
        ): Movie
        updateMovie(
            title: String!, 
            description: String, 
            release_year: Int, 
            runtime: Int, 
            genres: [String], 
            imdb_score: Float
        ): Movie
        deleteMovie(title: String!): Movie
    }
`;

// Define your resolvers
const resolvers = {
    Query: {
        movies: async (_, { title, genre, page = 1, limit = 10 }) => {
            const query = {};
            if (title) {
                query.title = { $regex: title, $options: 'i' }; // Case-insensitive search
            }
            if (genre) {
                query.genres = genre;
            }
            const skip = (page - 1) * limit;
            return await Movie.find(query).skip(skip).limit(limit);
        },
        movieByTitle: async (_, { title }) => {
            return await Movie.findOne({ title: { $regex: title, $options: 'i' } });
        },
    },
    Mutation: {
        addMovie: async (_, { id, title, description, release_year, runtime, genres, imdb_score, age_certification, production_countries, type }) => {
            const newMovie = new Movie({ id, title, description, release_year, runtime, genres, imdb_score, age_certification, production_countries, type });
            return await newMovie.save();
        },
        updateMovie: async (_, { title, description, release_year, runtime, genres, imdb_score }) => {
            const updateData = {};
            if (description) updateData.description = description;
            if (release_year) updateData.release_year = release_year;
            if (runtime) updateData.runtime = runtime;
            if (genres) updateData.genres = genres;
            if (imdb_score) updateData.imdb_score = imdb_score;

            const updatedMovie = await Movie.findOneAndUpdate(
                { title: { $regex: title, $options: 'i' } },
                updateData,
                { new: true }
            );

            return updatedMovie;
        },
        deleteMovie: async (_, { title }) => {
            const deletedMovie = await Movie.findOneAndDelete({ title: { $regex: title, $options: 'i' } }); // Case-insensitive search
            return deletedMovie;
        },
    },
};

// Create an instance of ApolloServer
const server = new ApolloServer({ typeDefs, resolvers, playground: true }); // Enable GraphQL Playground

// Create an instance of Express
const app = express();

// Redirect from root to GraphQL endpoint
app.get('/', (req, res) => {
    res.redirect('/graphql'); // Redirect from root to GraphQL endpoint
});

// Start the server
const startServer = async () => {
    await server.start();
    server.applyMiddleware({ app });

    app.listen({ port: 4000 }, () =>
        console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
    );
};

// Run the server
startServer();
